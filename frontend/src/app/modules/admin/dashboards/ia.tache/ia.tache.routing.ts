import { Route } from '@angular/router';
import { IatacheComponent } from './ia.tache.component';
import { IatacheResolver } from './ia.tache.resolvers';



export const IatacheRoutes: Route[] = [
    {
        path: '',
        component: IatacheComponent,
        resolve: {
            data: IatacheResolver
        }
    }
];
