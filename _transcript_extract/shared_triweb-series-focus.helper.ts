export const TRIWEB_SERIES_DIM_OPACITY = 0.10;
export const TRIWEB_SERIES_ACTIVE_OPACITY = 1;

const LINE_TYPES = new Set(['line', 'spline', 'stepline']);

function isLineLike(type: string | undefined): boolean
{
    return !!type && LINE_TYPES.has(type);
}

/**
 * Focus multi-séries DevExtreme : série active opaque, les autres très atténuées.
 * Utilise series.updateOptions() + mise à jour des points pour barres et courbes.
 */
export class TriwebSeriesFocusController
{
    private readonly _focused = new Map<string, string | null>();

    getFocusedSeries(chartKey: string): string | null
    {
        return this._focused.get(chartKey) ?? null;
    }

    isFocused(chartKey: string): boolean
    {
        return this.getFocusedSeries(chartKey) !== null;
    }

    onPointHoverChanged(chartKey: string, event: { target?: any; component?: any }): void
    {
        const name = event.target?.series?.name;

        if (!name)
        {
            return;
        }

        this._focused.set(chartKey, name);
        this.applySeriesFocus(event.component, name);
    }

    onLegendClick(chartKey: string, event: { target?: any; component?: any; cancel?: boolean }): void
    {
        const name = event.target?.name ?? (typeof event.target === 'string' ? event.target : null);

        if (!name)
        {
            return;
        }

        const next = this.getFocusedSeries(chartKey) === name ? null : name;
        this._focused.set(chartKey, next);
        this.applySeriesFocus(event.component, next);
        event.cancel = true;
    }

    onMouseLeave(chartKey: string, component?: any): void
    {
        this._focused.set(chartKey, null);
        this.applySeriesFocus(component, null);
    }

    applySeriesFocus(component: any, activeSeriesName: string | null): void
    {
        if (!component?.getAllSeries)
        {
            return;
        }

        const seriesList = component.getAllSeries();

        seriesList.forEach((series: any, index: number) => {
            const name = series.name;
            const isActive = !activeSeriesName || name === activeSeriesName;
            const type = series.type as string | undefined;
            const opacity = isActive ? TRIWEB_SERIES_ACTIVE_OPACITY : TRIWEB_SERIES_DIM_OPACITY;

            const update: Record<string, unknown> = { opacity };

            if (isLineLike(type))
            {
                update.width = isActive && activeSeriesName ? 3 : (activeSeriesName ? 1 : 2);
                update.point = {
                    visible: true,
                    size   : isActive && activeSeriesName ? 9 : (activeSeriesName ? 4 : 7),
                    border : {
                        visible: !!(isActive && activeSeriesName),
                        width  : isActive && activeSeriesName ? 2 : 0
                    }
                };
            }

            series.updateOptions(update);

            const points = series.getPoints?.() ?? [];

            points.forEach((point: any) => {
                point.update({ opacity }, { animate: false });
            });

            if (activeSeriesName && isActive && isLineLike(type))
            {
                seriesList.forEach((other: any, otherIndex: number) => {
                    if (otherIndex !== index && isLineLike(other.type))
                    {
                        other.toBackground?.();
                    }
                });
                series.toForeground?.();
            }
        });

        component.render?.({ animate: false });
    }
}
