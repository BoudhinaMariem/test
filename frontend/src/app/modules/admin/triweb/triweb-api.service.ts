import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TriwebApiService {
    private readonly apiBaseUrl = 'http://localhost:5000';

    constructor(private _httpClient: HttpClient) {}

    getItems(): Observable<any[]> {
        return this._httpClient.get<any>(`${this.apiBaseUrl}/api/dashboard/items`).pipe(
            map((response) => this._asArray(response)),
            tap((items) => console.log('[Triweb API] dossiers reçus =', items.length)),
            catchError((error) => {
                console.error('[Triweb API] erreur /api/dashboard/items', error);
                return of([]);
            })
        );
    }

    private _asArray(response: any): any[] {
        if (Array.isArray(response)) {
            return response;
        }

        if (response && Array.isArray(response.items)) {
            return response.items;
        }

        if (response && Array.isArray(response.data)) {
            return response.data;
        }

        if (response && Array.isArray(response.result)) {
            return response.result;
        }

        return [];
    }
}