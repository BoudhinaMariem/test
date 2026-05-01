
import { Component, ViewEncapsulation } from '@angular/core';
import { monthlyEvolution, teamMetrics } from '../triweb.data';

@Component({
    selector: 'triweb-performance',
    templateUrl: './performance.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TriwebPerformanceComponent {
    title = 'Performance';
    subtitle = 'Mesure du rendement, de la qualité et du respect des délais.';
    cards = [
        { label: 'Respect délais', value: '91.8%', note: '+2.1 pts vs mois dernier' },
        { label: 'Taux de retour', value: '6.4%', note: '-0.8 pts' },
        { label: 'Temps moyen cycle', value: '4.2 j', note: 'Stable' },
        { label: 'Productivité', value: '82%', note: 'Bon niveau' }
    ];
    teamMetrics = teamMetrics;
    monthlyEvolution = monthlyEvolution;
}
