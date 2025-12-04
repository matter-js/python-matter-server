import "@material/web/button/text-button";
import "@material/web/dialog/dialog";
import "@material/web/list/list";
import "@material/web/list/list-item";
import "../../../components/ha-svg-icon";
import "@material/web/textfield/outlined-text-field";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field";

import { html, LitElement, css, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { MatterNode } from "../../../client/models/node";
import { preventDefault } from "../../../util/prevent_default";
import { MatterClient } from "../../../client/client";
import {
  InputType,
  BindingEntryStruct,
  BindingEntryDataTransformer,
} from "./model";

import {
  AccessControlEntryDataTransformer,
  AccessControlEntryStruct,
  AccessControlTargetStruct,
} from "../acl/model";

import { consume } from "@lit/context";
import { clientContext } from "../../../client/client-context";

@customElement("node-binding-dialog")
export class NodeBindingDialog extends LitElement {
  @consume({ context: clientContext, subscribe: true })
  @property({ attribute: false })
  public client!: MatterClient;

  @property()
  public node?: MatterNode;

  @property({ attribute: false })
  endpoint!: number;

  @query("md-outlined-text-field[name='NodeId']")
  private _targetNodeId!: MdOutlinedTextField;

  @query("md-outlined-text-field[name='Endpoint']")
  private _targetEndpoint!: MdOutlinedTextField;

  @query("md-outlined-text-field[name='Cluster']")
  private _targetCluster!: MdOutlinedTextField;

  private fetchBindingEntry(): BindingEntryStruct[] {
    const bindings_raw: [] = this.node!.attributes[this.endpoint + "/30/0"];
    return Object.values(bindings_raw).map((value) =>
      BindingEntryDataTransformer.transform(value),
    );
  }

  private fetchACLEntry(targetNodeId: number): AccessControlEntryStruct[] {
    const acl_cluster_raw: [InputType] =
      this.client.nodes[targetNodeId].attributes["0/31/0"];
    return Object.values(acl_cluster_raw).map((value: InputType) =>
      AccessControlEntryDataTransformer.transform(value),
    );
  }

  private async deleteBindingHandler(index: number): Promise<void> {
    const rawBindings = this.fetchBindingEntry();
    try {
      const targetNodeId = rawBindings[index].node;
      const endpoint = rawBindings[index].endpoint;
      await this.removeNodeAtACLEntry(
        this.node!.node_id,
        endpoint,
        targetNodeId,
      );
      const updatedBindings = this.removeBindingAtIndex(rawBindings, index);
      await this.syncBindingUpdates(updatedBindings, index);
    } catch (error) {
      this.handleBindingDeletionError(error);
    }
  }

  private async removeNodeAtACLEntry(
    sourceNodeId: number,
    sourceEndpoint: number,
    targetNodeId: number,
  ): Promise<void> {
    const aclEntries = this.fetchACLEntry(targetNodeId);

    const updatedACLEntries = aclEntries
      .map((entry) =>
        this.removeEntryAtACL(sourceNodeId, sourceEndpoint, entry),
      )
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

    await this.client.setACLEntry(targetNodeId, updatedACLEntries);
  }

  private removeEntryAtACL(
    nodeId: number,
    sourceEndpoint: number,
    entry: AccessControlEntryStruct,
  ): AccessControlEntryStruct | undefined {
    const hasSubject = entry.subjects!.includes(nodeId);
    if (!hasSubject) return entry;

    const hasTarget = entry.targets!.filter(
      (item) => item.endpoint === sourceEndpoint,
    );
    return hasTarget.length > 0 ? undefined : entry;
  }

  private removeBindingAtIndex(
    bindings: BindingEntryStruct[],
    index: number,
  ): BindingEntryStruct[] {
    return [...bindings.slice(0, index), ...bindings.slice(index + 1)];
  }

  private async syncBindingUpdates(
    updatedBindings: BindingEntryStruct[],
    index: number,
  ): Promise<void> {
    await this.client.setNodeBinding(
      this.node!.node_id,
      this.endpoint,
      updatedBindings,
    );

    const attributePath = `${this.endpoint}/30/0`;
    const updatedAttributes = {
      ...this.node!.attributes,
      [attributePath]: this.removeBindingAtIndex(
        this.node!.attributes[attributePath],
        index,
      ),
    };

    this.node!.attributes = updatedAttributes;
    this.requestUpdate();
  }

  private handleBindingDeletionError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Binding deletion failed: ${errorMessage}`);
  }

  private async _updateEntry<T>(
    targetId: number,
    path: string,
    entry: T,
    transformFn: (value: InputType) => T,
    updateFn: (targetId: number, entries: T[]) => Promise<any>,
  ) {
    try {
      const rawEntries: [InputType] =
        this.client.nodes[targetId].attributes[path];
      const entries = Object.values(rawEntries).map(transformFn);
      entries.push(entry);
      return await updateFn(targetId, entries);
    } catch (err) {
      console.log(err);
    }
  }

  private async add_target_acl(
    targetNodeId: number,
    entry: AccessControlEntryStruct,
  ) {
    try {
      const result = (await this._updateEntry(
        targetNodeId,
        "0/31/0",
        entry,
        AccessControlEntryDataTransformer.transform,
        this.client.setACLEntry.bind(this.client),
      )) as { [key: string]: { Status: number } };
      return result["0"].Status === 0;
    } catch (err) {
      console.error("add acl error:", err);
      return false;
    }
  }

  private async add_bindings(
    endpoint: number,
    bindingEntry: BindingEntryStruct,
  ) {
    const bindings = this.fetchBindingEntry();
    bindings.push(bindingEntry);
    try {
      const result = (await this.client.setNodeBinding(
        this.node!.node_id,
        endpoint,
        bindings,
      )) as { [key: string]: { Status: number } };
      return result["0"].Status === 0;
    } catch (err) {
      console.log("add bindings error:", err);
      return false;
    }
  }

  async addBindingHandler() {
    const targetNodeId = this._targetNodeId.value
      ? parseInt(this._targetNodeId.value, 10)
      : undefined;
    const targetEndpoint = this._targetEndpoint.value
      ? parseInt(this._targetEndpoint.value, 10)
      : undefined;
    const targetCluster = this._targetCluster.value
      ? parseInt(this._targetCluster.value, 10)
      : undefined;

    // Matter Server does not use random NodeIds, so this is ok for now, but needs to be adjusted later
    if (
      targetNodeId === undefined ||
      targetNodeId <= 0 ||
      targetNodeId > 65535
    ) {
      alert("Please enter a valid target node ID");
      return;
    }

    if (
      targetEndpoint === undefined ||
      targetEndpoint <= 0 ||
      targetEndpoint > 0xfffe
    ) {
      alert("Please enter a valid target endpoint");
      return;
    }

    // cluster optional
    if (targetCluster !== undefined) {
      // We ignore vendor specific clusters for now
      if (targetCluster < 0 || targetCluster > 0x7fff) {
        alert("Please enter a valid target cluster");
        return;
      }
    }

    const targets: AccessControlTargetStruct = {
      endpoint: targetEndpoint,
      cluster: targetCluster,
      deviceType: undefined,
    };

    const acl_entry: AccessControlEntryStruct = {
      privilege: 5,
      authMode: 2,
      subjects: [this.node!.node_id],
      targets: [targets],
      fabricIndex: this.client.connection.serverInfo!.fabric_id,
    };

    const result_acl = await this.add_target_acl(targetNodeId, acl_entry);
    if (!result_acl) {
      alert("add target acl error!");
      return;
    }

    const endpoint = this.endpoint;
    const bindingEntry: BindingEntryStruct = {
      node: targetNodeId,
      endpoint: targetEndpoint,
      group: undefined,
      cluster: targetCluster,
      fabricIndex: this.client.connection.serverInfo!.fabric_id,
    };

    const result_binding = await this.add_bindings(endpoint, bindingEntry);

    if (result_binding) {
      this._targetNodeId.value = "";
      this._targetEndpoint.value = "";
      this._targetCluster.value = "";
      this.requestUpdate();
    }
  }

  private _close() {
    this.shadowRoot!.querySelector("md-dialog")!.close();
  }

  private _handleClosed() {
    this.parentNode!.removeChild(this);
  }

  private onChange(e: Event) {
    const textfield = e.target as MdOutlinedTextField;
    const value = parseInt(textfield.value, 10);

    if (
      parseInt(textfield.max, 10) < value ||
      value < parseInt(textfield.min, 10)
    ) {
      textfield.error = true;
      textfield.errorText = "value error";
    } else {
      textfield.error = false;
    }

    // console.log(`value: ${value} error: ${textfield.error}`);
  }

  protected render() {
    const bindings = Object.values(
      this.node!.attributes[this.endpoint + "/30/0"],
    ).map((entry) => BindingEntryDataTransformer.transform(entry));

    return html`
      <md-dialog open @cancel=${preventDefault} @closed=${this._handleClosed}>
        <div slot="headline">
          <div>Binding</div>
        </div>
        <div slot="content">
          <div>
            <md-list style="padding-bottom:18px;">
              ${Object.values(bindings).map(
                (entry, index) => html`
                  <md-list-item style="background:cornsilk;">
                    <div style="display:flex;gap:10px;">
                        <div>node:${entry["node"]}</div>
                        <div>endpoint:${entry["endpoint"]}</div>
                        ${entry["cluster"] ? html` <div>cluster:${entry["cluster"]}</div> ` : nothing}
                    </div>
                    <div slot="end">
                      <md-text-button
                        @click=${() => this.deleteBindingHandler(index)}
                      >delete</md-text-button
                    </div>
                  </md-list-item>
                `,
              )}
            </md-list>
            <div class="inline-group">
              <div class="group-label">target</div>
              <div class="group-input">
                <md-outlined-text-field
                  label="node id"
                  name="NodeId"
                  type="number"
                  min="0"
                  max="65535"
                  class="target-item"
                  @change=${this.onChange}
                  supporting-text="required"
                ></md-outlined-text-field>
                <md-outlined-text-field
                  label="endpoint"
                  name="Endpoint"
                  type="number"
                  min="0"
                  max="65534"
                  @change=${this.onChange}
                  class="target-item"
                  supporting-text="required"
                ></md-outlined-text-field>
                <md-outlined-text-field
                  label="cluster"
                  name="Cluster"
                  type="number"
                  min="0"
                  max="32767"
                  @change=${this.onChange}
                  class="target-item"
                  supporting-text="optional"
                ></md-outlined-text-field>
              </div>
            </div>
            <div style="margin:8px;">
              <Text
                style="font-size: 10px;font-style: italic;font-weight: bold;"
              >
                Note: The Cluster ID field is optional according to the Matter
                specification. If you leave it blank, the binding applies to all
                eligible clusters on the target endpoint. However, some devices
                may require a specific cluster to be set in order for the
                binding to function correctly. If you experience unexpected
                behavior, try specifying the cluster explicitly.
              </Text>
            </div>
          </div>
        </div>
        <div slot="actions">
          <md-text-button @click=${this.addBindingHandler}>Add</md-text-button>
          <md-text-button @click=${this._close}>Cancel</md-text-button>
        </div>
      </md-dialog>
    `;
  }

  static styles = css`
    .inline-group {
      display: flex;
      border: 2px solid #673ab7;
      padding: 1px;
      border-radius: 8px;
      position: relative;
      margin: 8px;
    }

    .group-input {
      display: flex;
      width: -webkit-fill-available;
    }

    .target-item {
      display: inline-block;
      padding: 20px 10px 10px 10px;
      border-radius: 4px;
      vertical-align: middle;
      min-width: 80px;
      text-align: center;
      width: -webkit-fill-available;
    }

    .group-label {
      position: absolute;
      left: 15px;
      top: -12px;
      background: #673ab7;
      color: white;
      padding: 3px 15px;
      border-radius: 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "node-binding-dialog": NodeBindingDialog;
  }
}
