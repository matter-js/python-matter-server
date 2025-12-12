import "@material/web/iconbutton/icon-button";
import { LitElement, css, html } from "lit";
import { guard } from 'lit/directives/guard.js';
import { customElement, property } from "lit/decorators.js";
import "@material/web/list/list";
import "@material/web/list/list-item";
import "@material/web/divider/divider";
import { MatterClient } from "../client/client";
import "../components/ha-svg-icon";
import { mdiChevronRight } from "@mdi/js";
import { MatterNode } from "../client/models/node";
import { DeviceType, clusters, device_types } from "../client/models/descriptions";

declare global {
  interface HTMLElementTagNameMap {
    "matter-endpoint-view": MatterEndpointView;
  }
}

function getUniqueClusters(node: MatterNode, endpoint: Number) {
  return Array.from(new Set(Object.keys(node!.attributes)
    .filter(key => key.startsWith(`${endpoint.toString()}/`))
    .map(key => Number(key.split("/")[1]))))
    .sort((a, b) => { return a - b });
}

export function getEndpointDeviceTypes(node: MatterNode, endpoint: Number): DeviceType[] {
  const rawValues: Record<string, number>[] | undefined = node.attributes[`${endpoint}/29/0`];
  if (!rawValues) return [];
  return rawValues.map((rawValue) => {
    const id = rawValue["0"] ?? rawValue["deviceType"];
    return device_types[id] || { id: id ?? -1, label: `Unknown Device Type (${id})`, clusters: [] };
  });
}

@customElement("matter-endpoint-view")
class MatterEndpointView extends LitElement {
  public client!: MatterClient;

  @property()
  public node?: MatterNode;

  @property()
  public endpoint?: number;

  render() {

    if (!this.node || this.endpoint == undefined) {
      return html`
        <p>Node or endpoint not found!</p>
        <button
          @click=${this._goBack}
        >
          Back
        </button>
      `;
    }

    return html`
      <dashboard-header
        .title=${`Node ${this.node.node_id}  |  Endpoint ${this.endpoint}`}
        .backButton=${`#node/${this.node.node_id}`}
        .client=${this.client}
      ></dashboard-header>

      <!-- node details section -->
      <div class="container">
      <node-details
          .node=${this.node}
          .client=${this.client}
        ></node-details>
      </div>

      <!-- Endpoint clusters listing -->
      <div class="container">
        <md-list>
          <md-list-item>
            <div slot="headline">
                <b>Clusters on Endpoint ${this.endpoint}</b>
            </div>
            <div slot="supporting-text">
              Device Type(s): ${getEndpointDeviceTypes(this.node, this.endpoint).map(deviceType => { return deviceType.label }).join(" / ")}
            </div>
          </md-list-item>
          ${guard([this.node?.attributes.length], () => getUniqueClusters(this.node!, this.endpoint!).map((cluster) => {
      return html`
            <md-list-item type="link" href=${`#node/${this.node!.node_id}/${this.endpoint}/${cluster}`}>
              <div slot="headline">
              ${clusters[cluster]?.label || 'Custom/Unknown Cluster'}
              </div>
              <div slot="supporting-text">
                ClusterId ${cluster} (0x00${cluster.toString(16)})
              </div>
              <ha-svg-icon slot="end" .path=${mdiChevronRight}></ha-svg-icon>
            </md-list-item>
          `;
    }))}
        </md-list>
      </div>
    `;
  }

  private _goBack() {
    history.back();
  }

  static styles = css`
    :host {
      display: block;
      background-color: var(--md-sys-color-background);
    }

    .header {
      background-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      --icon-primary-color: var(--md-sys-color-on-primary);
      font-weight: 400;
      display: flex;
      align-items: center;
      padding-right: 8px;
      height: 48px;
    }

    md-icon-button {
      margin-right: 8px;
    }

    .flex {
      flex: 1;
    }

    .container {
      padding: 16px;
      max-width: 95%;
      margin: 0 auto;
    }

    .status {
      color: var(--danger-color);
      font-weight: bold;
      font-size: 0.8em;
    }
  `;
}
