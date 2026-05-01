
import { Component, ViewEncapsulation } from '@angular/core';
import { availabilityItems } from '../triweb.data';

@Component({
    selector: 'triweb-disponibilite',
    templateUrl: './disponibilite.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TriwebDisponibiliteComponent {
    title = 'Disponibilité';
    subtitle = 'Présences, charge disponible et visibilité équipe.';
    availabilityItems = availabilityItems;
    statusData = [
        { statut: 'Disponible', valeur: 2 },
        { statut: 'Charge haute', valeur: 1 },
        { statut: 'Absence', valeur: 1 }
    ];
}
