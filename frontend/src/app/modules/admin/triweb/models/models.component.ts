
import { Component, ViewEncapsulation } from '@angular/core';
import { modelsItems } from '../triweb.data';

@Component({
    selector: 'triweb-models',
    templateUrl: './models.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TriwebModelsComponent {
    title = 'Models IA';
    subtitle = 'Préparation du déploiement Python et suivi des modèles IA.';
    modelsItems = modelsItems;
}
