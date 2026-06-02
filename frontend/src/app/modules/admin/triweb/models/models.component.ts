import { Component, OnInit } from '@angular/core';

import {
    TriwebApiService,
    MlPredictionRequest,
    MlPredictionResult
} from '../triweb-api.service';

@Component({
    selector: 'app-models',
    templateUrl: './models.component.html'
})
export class ModelsComponent implements OnInit {
    loading = false;
    checkingApi = false;

    errorMessage = '';
    apiStatus: any = null;

    result: MlPredictionResult | null = null;

    form: MlPredictionRequest = this.getDefaultForm();

    positionOptions = [
        'Production',
        'Client',
        'CQ Client',
        'CQ Interne',
        'FTP',
        'Archive'
    ];

    statutOptions = [
        'En cours',
        'Livré',
        'Validé',
        'Non Conforme',
        'En instance'
    ];

    loiTypeOptions = [
        { label: '1 - Production Standard', value: 'production_standard' },
        { label: '2 - Refonte avec rédaction', value: 'refonte_avec_redaction' },
        { label: '3 - Refonte sans rédaction', value: 'refonte_sans_redaction' },
        { label: '4 - Ticket Modification', value: 'ticket_modification' },
        { label: 'Autre', value: 'autre' }
    ];

    etatOptions = [
        '',
        'Affecté',
        'En cours',
        'En pause',
        'Validé',
        'Retour CQ',
        'Retour CQ traité'
    ];

    constructor(private triwebApiService: TriwebApiService) {}

    ngOnInit(): void {
        this.checkHealth();
    }

    checkHealth(): void {
        this.checkingApi = true;
        this.errorMessage = '';

        this.triwebApiService.getMlHealth().subscribe({
            next: (res) => {
                this.apiStatus = res;
                this.checkingApi = false;
                this.errorMessage = '';
            },
            error: (err) => {
                this.apiStatus = null;
                this.checkingApi = false;
                this.errorMessage =
                    err?.message ||
                    'FastAPI ML non connectée. Vérifie /api/ml-models/health.';
            }
        });
    }

    predict(): void {
        this.loading = true;
        this.errorMessage = '';
        this.result = null;

        this.triwebApiService.predictMlAll(this.form).subscribe({
            next: (res) => {
                this.result = res;
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage =
                    err?.message ||
                    'Erreur pendant la prédiction ML.';
            }
        });
    }

    resetForm(): void {
        this.result = null;
        this.errorMessage = '';
        this.form = this.getDefaultForm();
    }

    getRiskClass(): string {
        const risk = this.result?.retard?.niveau_risque_retard;

        if (risk === 'Élevé') {
            return 'text-red-600';
        }

        if (risk === 'Moyen') {
            return 'text-orange-500';
        }

        return 'text-green-600';
    }

    getScoreClass(): string {
        const score = Number(this.result?.affectation?.score_affectation || 0);

        if (score >= 70) {
            return 'text-green-600';
        }

        if (score >= 45) {
            return 'text-orange-500';
        }

        return 'text-red-600';
    }

    getApiStatusLabel(): string {
        return this.apiStatus
            ? 'FastAPI ML connectée'
            : 'FastAPI ML non connectée';
    }

    private getDefaultForm(): MlPredictionRequest {
        return {
            position: 'Production',
            statut: 'En cours',
            loiType: 'production_standard',
            nature: 'Site - LocalVisibilité',

            etatR: 'En cours',
            etatG: 'En cours',
            etatCqi: '',
            etatCqc: '',

            teamR: '',
            teamG: '',

            page: 5,
            charge: 8,
            totalHours: 8,

            dureeRMin: 0,
            dureeGMin: 0,
            dureeCqiMin: 0,
            dureeCqcMin: 0,

            joursRestants: 1
        };
    }
}