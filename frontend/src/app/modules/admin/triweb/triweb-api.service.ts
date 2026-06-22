import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MlPredictionRequest {
    position: string;
    statut: string;
    loiType: string;
    nature: string;

    etatR: string;
    etatG: string;
    etatCqi: string;
    etatCqc: string;

    teamR: string;
    teamG: string;

    page: number;
    charge: number;
    totalHours: number;

    dureeRMin: number;
    dureeGMin: number;
    dureeCqiMin: number;
    dureeCqcMin: number;

    joursRestants: number;
}

export interface MlPredictionResult {
    retard: {
        prob_retard: number;
        niveau_risque_retard: string;
    };

    charge: {
        charge_estimee_minutes: number;
        charge_estimee_heures: number;
    };

    affectation: {
        score_affectation: number;
        avis: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class TriwebApiService {
    /**
     * IMPORTANT :
     * Mets ici la route qui existe vraiment dans ton backend .NET.
     *
     * Si ton navigateur affiche du JSON avec :
     * http://localhost:5000/api/dashboard/items
     * garde /api/dashboard/items.
     *
     * Si c'est plutôt :
     * http://localhost:5000/api/dashboard-source/items
     * remplace par /api/dashboard-source/items.
     */
    private readonly dashboardSourceUrl = 'http://localhost:5000/api/dashboard/items';

    /**
     * Angular -> .NET -> FastAPI
     */
    private readonly mlBaseUrl = 'http://localhost:5000/api/ml-models';

    constructor(private http: HttpClient) {}

    getItems(): Observable<any[]> {
        return this.http
            .get<any[]>(this.dashboardSourceUrl)
            .pipe(catchError((error) => this.handleError(error)));
    }

    getMlHealth(): Observable<any> {
        return this.http
            .get<any>(`${this.mlBaseUrl}/health`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    predictMlAll(payload: MlPredictionRequest): Observable<MlPredictionResult> {
        return this.http
            .post<MlPredictionResult>(
                `${this.mlBaseUrl}/predict/all`,
                this.toMlBody(payload)
            )
            .pipe(catchError((error) => this.handleError(error)));
    }

    predictMlRetard(payload: MlPredictionRequest): Observable<any> {
        return this.http
            .post<any>(
                `${this.mlBaseUrl}/predict/retard`,
                this.toMlBody(payload)
            )
            .pipe(catchError((error) => this.handleError(error)));
    }

    predictMlCharge(payload: MlPredictionRequest): Observable<any> {
        return this.http
            .post<any>(
                `${this.mlBaseUrl}/predict/charge`,
                this.toMlBody(payload)
            )
            .pipe(catchError((error) => this.handleError(error)));
    }

    predictMlAffectation(payload: MlPredictionRequest): Observable<any> {
        return this.http
            .post<any>(
                `${this.mlBaseUrl}/predict/affectation`,
                this.toMlBody(payload)
            )
            .pipe(catchError((error) => this.handleError(error)));
    }

    private toMlBody(payload: MlPredictionRequest): any {
        return {
            position: payload.position || 'Production',
            statut: payload.statut || 'En cours',
            loi_type: payload.loiType || 'production_standard',
            nature: payload.nature || '',

            etatR: payload.etatR || '',
            etatG: payload.etatG || '',
            etatCqi: payload.etatCqi || '',
            etatCqc: payload.etatCqc || '',

            teamR: payload.teamR || '',
            teamG: payload.teamG || '',

            page: Number(payload.page || 0),
            charge: Number(payload.charge || 0),
            totalHours: Number(payload.totalHours || 0),

            dureeR_min: Number(payload.dureeRMin || 0),
            dureeG_min: Number(payload.dureeGMin || 0),
            dureeCqi_min: Number(payload.dureeCqiMin || 0),
            dureeCqc_min: Number(payload.dureeCqcMin || 0),

            jours_restants: Number(payload.joursRestants || 999)
        };
    }

    private handleError(error: HttpErrorResponse) {
        console.error('Erreur API Triweb:', error);

        let message = 'Erreur inconnue';

        if (error.status === 0) {
            message = 'API inaccessible. Vérifie FastAPI, .NET, le proxy Angular ou CORS.';
        } else if (error.status === 404) {
            message = `Route API introuvable : ${error.url || ''}`;
        } else if (error.status === 500) {
            message =
                error.error?.detail ||
                error.error?.message ||
                'Erreur serveur .NET ou FastAPI.';
        } else {
            message =
                error.error?.message ||
                error.message ||
                `Erreur HTTP ${error.status}`;
        }

        return throwError(() => ({
            status: error.status,
            message,
            originalError: error
        }));
    }

    predictPlanningRisk(payload: MlPredictionRequest): Observable<any> {
        return this.http
            .post<any>(
                `${this.mlBaseUrl}/predict/planning-risk`,
                this.toMlBody(payload)
            )
            .pipe(catchError((error) => this.handleError(error)));
    }
}