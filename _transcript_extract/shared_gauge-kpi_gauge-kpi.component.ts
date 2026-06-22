import { Component, Input } from '@angular/core';

export type GaugeKpiColorMode = 'threshold' | 'planning';

@Component({
    selector   : 'triweb-gauge-kpi',
    templateUrl: './gauge-kpi.component.html',
    styleUrls  : ['./gauge-kpi.component.scss']
})
export class GaugeKpiComponent
{
    @Input() title = '';
    @Input() value = 0;
    @Input() subtitle = '';
    @Input() status = '';
    @Input() max = 100;
    @Input() unit = '%';
    @Input() colorMode: GaugeKpiColorMode = 'threshold';

    get percentage(): number
    {
        if (!this.max)
        {
            return 0;
        }

        return Math.min(100, Math.max(0, (this.value / this.max) * 100));
    }

    get displayValue(): string
    {
        const rounded = Math.round(this.value * 10) / 10;

        return `${rounded}${this.unit}`;
    }

    get gaugeColor(): string
    {
        const pct = this.percentage;

        if (this.colorMode === 'planning')
        {
            if (pct >= 75)
            {
                return '#54B399';
            }

            if (pct >= 50)
            {
                return '#F7B47F';
            }

            return '#EA7862';
        }

        if (pct >= 75)
        {
            return '#54B399';
        }

        if (pct >= 50)
        {
            return '#F7B47F';
        }

        return '#EA7862';
    }

    get gaugeStyle(): Record<string, string>
    {
        return {
            '--gauge-color': this.gaugeColor,
            '--gauge-value': String(this.percentage)
        };
    }
}
