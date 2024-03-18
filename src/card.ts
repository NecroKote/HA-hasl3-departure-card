import { LitElement, html, nothing, css } from 'lit'
import { property, state } from 'lit/decorators';

import type { HomeAssistant, LovelaceCard } from "custom-card-helpers";

import type { HassEvent } from './hass'
import type { DepartureAttributes, DeviationsAttributes } from "./models"
import type { PartialEntityConfig } from './DepartureEntityConfig'
import { t } from './translations'
import { DepartureCardConfig, DEFAULT_CONFIG } from './DepartureCardConfig'

export class HASLDepartureCard extends LitElement implements LovelaceCard {
    static styles = css`
        .card-header {
            display: flex;
            justify-content: space-between;
        }
        .card-header .name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: elipsis;
        }
    `

    @state()
    private config?: DepartureCardConfig

    @property({ attribute: false })
    public hass?: HomeAssistant

    setConfig(config: DepartureCardConfig) {
        this.config = {...DEFAULT_CONFIG, ...config}
    }

    getCardSize = () => this.config.entities.length + 1;

    // configuration card is loaded in async manner
    static async getConfigElement () {
        await import('./editor')
        return document.createElement("hasl-departure-card-editor")
    }
    static getStubConfig = () => ({...DEFAULT_CONFIG})

    render() {
        // console.debug('render!', this.config, this.hass)
        if (!this.config || !this.hass) return nothing

        const lang = (this.config?.language
            ? this.config.language
            : navigator.language) ?? 'sv-SE'

        const _ = (key: string): string => t(lang, key)

        const entities = this.config?.entities?.map(entity => {
            const data = this.hass?.states[entity]
            if (data === undefined) return nothing;

            if(isDepartureAttrs(data.attributes) && this.config?.show_departures) {
                const attrs = data.attributes
                const config: PartialEntityConfig = {
                    lang: lang,
                    showHeader: this.config?.show_header,
                    showUpdated: this.config?.show_updated,
                    showName: this.config?.show_entity_name,
                    showIcon: this.config?.show_icon,
                    friendlyName: attrs.friendly_name,
                    hideDeparted: this.config?.hide_departed,
                    departedOffset: this.config?.show_departed_offeset,
                    lastUpdated: new Date(data.last_updated),
                    lastChanged: new Date(data.last_changed),
                    adjustTime: this.config?.adjust_departure_time,
                    alwaysTime: this.config?.show_time_always,
                }

                const maxDepartures = this.config?.max_departures || attrs.departures.length
                const departures = attrs.departures.slice(0, maxDepartures)
                return html`<hasl-departure-entity
                    .config=${config}
                    .departures=${departures}
                />`
            } else if (isDeviationsAttrs(data.attributes)) {
                // TODO: figure out how to present stop deviations
                // console.debug('deviations!', data.attributes)
            }

            return nothing

        }) || nothing

        return html`
            <ha-card @click="${this._handleClick}">
                ${this.config?.show_name
                    ? (this.config?.name
                        ? html`<h1 class="card-header"><div class="name">${this.config.name}</div></h1>`
                        : nothing)
                    : nothing}
                <div id="departures" class="card-content">
                    ${this.config?.show_departures ? entities : nothing}
                </div>
            </ha-card>
        `
    }

    private _handleClick(e) {
        switch (this.config?.tap_action) {
            case 'info':
                this._showAttributes(this, "hass-more-info", { entityId: this.config.tap_action_entity });
                break
            case 'service':
                this._serviceCall(this.config.service_config.domain, this.config.service_config.service, this.config.service_config.data)
                break
        }
    }

    private _serviceCall (domain, service, data) {
        this.hass.callService(domain, service, data)
    }

    private _showAttributes (el: HTMLElement, type: string, detail?: object, options?: { bubbles?: boolean, cancelable?: boolean, composed?: boolean }) {
        const event = new Event(type, {
            bubbles: Boolean(options?.bubbles),
            cancelable: Boolean(options?.cancelable),
            composed: Boolean(options?.composed) || true
        });
        (event as HassEvent).detail = detail || {};

        el.dispatchEvent(event);
        return event;
    }
}

function isDepartureAttrs(item: { [key:string]: any }): item is DepartureAttributes {
    return (item as DepartureAttributes).departures !== undefined
}

function isDeviationsAttrs(item: { [key:string]: any }): item is DeviationsAttributes {
    return (item as DeviationsAttributes).deviations !== undefined
}

declare global {
    interface HTMLElementTagNameMap {
        "hasl-departure-card": HASLDepartureCard
    }
}
