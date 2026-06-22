import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';

@Injectable({
    providedIn: 'root'
})
export class NavigationService
{
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
    private _lastMenuItems: any[] | null = null;

    private readonly _menuKeyById: Record<string, string> = {
        'triweb.dashboard'  : 'nav.triweb.dashboard',
        'triweb.planification': 'nav.triweb.planification',
        'triweb.powerbi'    : 'nav.triweb.powerbi',
        'triweb.models'     : 'nav.triweb.models',
        'dashboard'         : 'nav.triweb.dashboard',
        'planification'     : 'nav.triweb.planification',
        'powerbi'           : 'nav.triweb.powerbi',
        'models'            : 'nav.triweb.models'
    };

    constructor(
        private _httpClient: HttpClient,
        private _translocoService: TranslocoService
    )
    {
        this._translocoService.langChanges$.subscribe(() => {
            if (this._lastMenuItems)
            {
                this._navigation.next(this._buildNavigation(this._lastMenuItems));
            }
        });
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
            map((items) => {
                this._lastMenuItems = items || [];
                return this._buildNavigation(this._lastMenuItems);
            }),
            catchError(() => this._httpClient.get<Navigation>('api/common/navigation').pipe(
                map((navigation) => {
                    this._lastMenuItems = navigation?.default?.[0]?.children || [];
                    return this._buildNavigation(this._lastMenuItems);
                })
            )),
            tap((navigation) => {
                this._navigation.next(navigation);
            })
        );
    }

    private _buildNavigation(items: any[]): Navigation
    {
        const children: FuseNavigationItem[] = (items || []).map((item) => {
            const id = item.id?.startsWith('triweb.') ? item.id : `triweb.${item.id}`;

            return {
                id,
                title: this._translateMenuItem(id),
                type : 'basic',
                icon : item.icon,
                link : item.link
            };
        });

        const defaultNavigation: FuseNavigationItem[] = [
            {
                id      : 'triweb',
                title   : this._translocoService.translate('nav.triweb.group'),
                subtitle: this._translocoService.translate('nav.triweb.groupSubtitle'),
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

    private _translateMenuItem(id: string): string
    {
        const key = this._menuKeyById[id];

        return key ? this._translocoService.translate(key) : id;
    }
}
