import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';

@Injectable({
    providedIn: 'root'
})
export class NavigationService
{
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    constructor(private _httpClient: HttpClient)
    {
    }

    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    get(): Observable<Navigation>
    {
        return this._httpClient.get<{ apiBaseUrl: string }>('assets/app-config.json').pipe(
            map((config) => config && config.apiBaseUrl ? config.apiBaseUrl.replace(/\/$/, '') : 'http://localhost:5000'),
            switchMap((baseUrl) => this._httpClient.get<any[]>(`${baseUrl}/api/menu`)),
            map((items) => this._buildNavigation(items)),
            catchError(() => this._httpClient.get<Navigation>('api/common/navigation')),
            tap((navigation) => {
                this._navigation.next(navigation);
            })
        );
    }

    private _buildNavigation(items: any[]): Navigation
    {
        const children: FuseNavigationItem[] = (items || []).map((item) => ({
            id   : `triweb.${item.id}`,
            title: item.title,
            type : 'basic',
            icon : item.icon,
            link : item.link
        }));

        const defaultNavigation: FuseNavigationItem[] = [
            {
                id      : 'triweb',
                title   : 'Triweb Pilotage',
                subtitle: 'Dashboard et planification',
                type    : 'group',
                icon    : 'heroicons_outline:home',
                children
            }
        ];

        const compactNavigation = children.map((item) => ({...item}));

        return {
            compact   : compactNavigation,
            default   : defaultNavigation,
            futuristic: defaultNavigation,
            horizontal: compactNavigation
        } as Navigation;
    }
}
