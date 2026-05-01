
import { Component, ViewEncapsulation } from '@angular/core';
import { productionItems } from '../triweb.data';

@Component({
    selector: 'triweb-production',
    templateUrl: './production.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TriwebProductionComponent {
    title = 'Production';
    subtitle = 'Suivi détaillé des dossiers, filtres et charge de travail.';
    search = '';
    selectedEquipe: string | null = null;
    selectedStatut: string | null = null;
    items = productionItems;
    equipes = ['Web', 'SEO', 'Contenu', 'Support'];
    statuts = ['En cours', 'Planifié', 'Validé', 'En retard'];
    teamChart = [
        { equipe: 'Web', nb: 2 },
        { equipe: 'SEO', nb: 1 },
        { equipe: 'Contenu', nb: 1 },
        { equipe: 'Support', nb: 1 }
    ];

    get filteredItems(): any[] {
        return this.items.filter(item => {
            const matchEquipe = !this.selectedEquipe || item.equipe === this.selectedEquipe;
            const matchStatut = !this.selectedStatut || item.statut === this.selectedStatut;
            const q = this.search.toLowerCase();
            const matchSearch = !q || [item.dossier, item.client, item.activite, item.equipe].join(' ').toLowerCase().includes(q);
            return matchEquipe && matchStatut && matchSearch;
        });
    }
}
