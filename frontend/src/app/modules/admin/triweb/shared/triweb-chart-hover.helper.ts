export type TriwebChartHoverMode = 'series' | 'argument';

export interface TriwebChartHoverEntry {
    seriesName: string | null;
    argument: string | null;
}

export const TRIWEB_CHART_DIM_OPACITY = 0.22;
export const TRIWEB_CHART_NORMAL_OPACITY = 1;

/**
 * Contrôleur réutilisable pour le survol DevExtreme :
 * série / segment actif à opacité normale, les autres atténués.
 */
export class TriwebChartHoverController
{
    private readonly _state = new Map<string, TriwebChartHoverEntry>();

    onPointHoverChanged(chartKey: string, event: { target?: any; component?: any }): void
    {
        if (event.target)
        {
            this._state.set(chartKey, {
                seriesName: event.target.series?.name ?? null,
                argument   : event.target.argument ?? null
            });
        }
        else
        {
            this.clearHover(chartKey, event.component);
            return;
        }

        event.component?.render({ animate: false });
    }

    onLegendHoverChanged(chartKey: string, event: { target?: any; component?: any }): void
    {
        const series = event.target?.series;

        if (series?.name)
        {
            this._state.set(chartKey, {
                seriesName: series.name,
                argument   : null
            });
        }
        else
        {
            this.clearHover(chartKey, event.component);
            return;
        }

        event.component?.render({ animate: false });
    }

    onChartMouseLeave(chartKey: string, component?: any): void
    {
        this.clearHover(chartKey, component);
    }

    clearHover(chartKey: string, component?: any): void
    {
        this._state.set(chartKey, {
            seriesName: null,
            argument   : null
        });

        component?.render({ animate: false });
    }

    getHover(chartKey: string): TriwebChartHoverEntry | undefined
    {
        return this._state.get(chartKey);
    }

    customizePoint(
        chartKey: string,
        pointInfo: any,
        mode: TriwebChartHoverMode = 'series',
        baseCustomizer?: (pointInfo: any) => any
    ): any
    {
        const base = baseCustomizer ? (baseCustomizer(pointInfo) || {}) : {};
        const hover = this._state.get(chartKey);

        if (!hover || (!hover.seriesName && !hover.argument))
        {
            return { ...base, opacity: TRIWEB_CHART_NORMAL_OPACITY };
        }

        const isActive = mode === 'series'
            ? hover.seriesName === pointInfo.seriesName
            : hover.argument === pointInfo.argument;

        return {
            ...base,
            opacity: isActive ? TRIWEB_CHART_NORMAL_OPACITY : TRIWEB_CHART_DIM_OPACITY
        };
    }

    customizeSeries(
        chartKey: string,
        seriesInfo: any,
        mode: TriwebChartHoverMode = 'series'
    ): any
    {
        const hover = this._state.get(chartKey);

        if (!hover?.seriesName)
        {
            return { opacity: TRIWEB_CHART_NORMAL_OPACITY };
        }

        if (mode === 'argument')
        {
            return { opacity: TRIWEB_CHART_NORMAL_OPACITY };
        }

        const isActive = hover.seriesName === seriesInfo.seriesName;

        return {
            opacity: isActive ? TRIWEB_CHART_NORMAL_OPACITY : TRIWEB_CHART_DIM_OPACITY
        };
    }

    createCustomizer(
        chartKey: string,
        mode: TriwebChartHoverMode = 'series',
        baseCustomizer?: (pointInfo: any) => any
    ): (pointInfo: any) => any
    {
        return (pointInfo: any) => this.customizePoint(chartKey, pointInfo, mode, baseCustomizer);
    }

    createSeriesCustomizer(
        chartKey: string,
        mode: TriwebChartHoverMode = 'series'
    ): (seriesInfo: any) => any
    {
        return (seriesInfo: any) => this.customizeSeries(chartKey, seriesInfo, mode);
    }
}
