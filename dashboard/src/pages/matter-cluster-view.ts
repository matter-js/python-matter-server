import "@material/web/divider/divider";
import "@material/web/iconbutton/icon-button";
import "@material/web/list/list";
import "@material/web/list/list-item";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MatterClient } from "../client/client";
import { clusters } from "../client/models/descriptions";
import { MatterNode } from "../client/models/node";
import { showAlertDialog } from "../components/dialog-box/show-dialog-box";
import "../components/ha-svg-icon";
import "../pages/components/node-details";
import { provide } from "@lit/context";
import { bindingContext } from "./components/context";

declare global {
  interface HTMLElementTagNameMap {
    "matter-cluster-view": MatterClusterView;
  }
}

function clusterAttributes(
  attributes: { [key: string]: any },
  endpoint: number,
  cluster: number
) {
  // extract unique clusters from the node attributes, as (sorted) array
  return Object.keys(attributes)
    .filter((key) => key.startsWith(`${endpoint}/${cluster}`))
    .map((key) => {
      const attributeKey = Number(key.split("/")[2]);
      return { key: attributeKey, value: attributes[key] };
    }, [])
    .toSorted((a, b) => a.key - b.key);
}

@customElement("matter-cluster-view")
class MatterClusterView extends LitElement {
  public client!: MatterClient;

  @property()
  public node?: MatterNode;

  @provide({ context: bindingContext })
  @property()
  public endpoint!: number;

  @property()
  public cluster?: number;

  render() {
    if (!this.node || this.endpoint == undefined || this.cluster == undefined) {
      return html`
        <p>Node, endpoint or cluster not found!</p>
        <button @click=${this._goBack}>Back</button>
      `;
    }

    return html`
      <dashboard-header
        .title=${`Node ${this.node.node_id}  |  Endpoint ${this.endpoint}  |  Cluster ${this.cluster}`}
        .backButton=${`#node/${this.node.node_id}/${this.endpoint}`}
        .client=${this.client}
      ></dashboard-header>

      <!-- node details section -->
      <div class="container">
        <node-details .node=${this.node} .client=${this.client}></node-details>
      </div>

      <!-- Cluster attributes listing -->
      <div class="container">
        <md-list>
          <md-list-item>
            <div slot="headline">
              <b
                >Attributes of
                ${clusters[this.cluster]?.label || "Custom/Unknown Cluster"}
                Cluster on Endpoint ${this.endpoint}</b
              >
            </div>
            <div slot="supporting-text">
              ClusterId ${this.cluster} (0x00${this.cluster.toString(16)})
            </div>
          </md-list-item>
          ${clusterAttributes(
            this.node.attributes,
            this.endpoint,
            this.cluster
          ).map((attribute) => {
            return html`
              <md-list-item>
                <div slot="headline">
                  ${clusters[this.cluster!]?.attributes[attribute.key]?.label ||
                  "Custom/Unknown Attribute"}
                </div>
                <div slot="supporting-text">
                  AttributeId: ${attribute.key}
                  (0x00${attribute.key.toString(16)}) - Value type:
                  ${clusters[this.cluster!]?.attributes[attribute.key]?.type ||
                  "unknown"}
                </div>
                <div slot="end">
                  ${JSON.stringify(attribute.value).length > 20
                    ? html`<button
                        @click=${() => {
                          this._showAttributeValue(attribute.value);
                        }}
                      >
                        Show value
                      </button>`
                    : JSON.stringify(attribute.value)}
                </div>
              </md-list-item>
              <md-divider />
            `;
          })}
        </md-list>
      </div>
    `;
  }

  private async _showAttributeValue(value: any) {
    showAlertDialog({
      title: "Attribute value",
      text: JSON.stringify(value),
    });
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
