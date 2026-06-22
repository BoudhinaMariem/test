import { Injectable } from '@angular/core';
import * as Keycloak from 'keycloak-js';

const KEYCLOAK_REDIRECT_PATH = '/triweb/dashboard';
const KEYCLOAK_LOGOUT_REDIRECT_PATH = '/sign-in';

@Injectable({
    providedIn: 'root'
})
export class KeycloakService {
    private _keycloak: any;
    private _initPromise: Promise<boolean> | null = null;
    private _initialized = false;

    constructor() {
        const keycloakFactory = (Keycloak as any).default || Keycloak;

        this._keycloak = keycloakFactory({
            url: 'http://localhost:8080',
            realm: 'TRIWEB',
            clientId: 'triweb-frontend'
        });
    }

    /**
     * Initialise keycloak-js une seule fois par chargement de page.
     * - Sans check-sso (évite init error / Invalid nonce)
     * - responseMode query (Keycloak 26 renvoie ?code=&state=)
     * - useNonce false (compatible "Exclude Issuer From Authentication Response")
     */
    ensureReady(): Promise<boolean> {
        if (this._initialized) {
            return Promise.resolve(this.isAuthenticated());
        }

        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise = this._initOnce();
        return this._initPromise;
    }

    async login(): Promise<void> {
        await this.ensureReady();

        return this._keycloak.login({
            redirectUri: `${window.location.origin}${KEYCLOAK_REDIRECT_PATH}`
        });
    }

    async logout(): Promise<void> {
        await this.ensureReady();

        return this._keycloak.logout({
            redirectUri: `${window.location.origin}${KEYCLOAK_LOGOUT_REDIRECT_PATH}`
        });
    }

    isAuthenticated(): boolean {
        return !!this._keycloak.authenticated;
    }

    getUsername(): string {
        return this._keycloak.tokenParsed?.preferred_username || '';
    }

    getRoles(): string[] {
        const realmAccess = this._keycloak.tokenParsed?.realm_access;
        return realmAccess?.roles || [];
    }

    hasRole(role: string): boolean {
        return this.getRoles().includes(role);
    }

    syncLocalSession(): void {
        if (!this.isAuthenticated()) {
            return;
        }

        localStorage.setItem('accessToken', 'keycloak');
        localStorage.setItem('user', JSON.stringify({
            email: this.getUsername(),
            name: this.getUsername(),
            role: this.getRoles().join(', ')
        }));
    }

    isOAuthCallback(): boolean {
        const search = new URLSearchParams(window.location.search);

        return search.has('code') && search.has('state');
    }

    async getToken(): Promise<string | undefined> {
        if (!this._keycloak.authenticated) {
            return undefined;
        }

        try {
            await this._keycloak.updateToken(30);
            return this._keycloak.token;
        } catch (error) {
            console.error('Keycloak token refresh error:', error);
            return undefined;
        }
    }

    private _initOnce(): Promise<boolean> {
        return this._keycloak.init({
            checkLoginIframe: false,
            pkceMethod: 'S256',
            flow: 'standard',
            responseMode: 'query',
            useNonce: false
        } as any)
            .then((authenticated: boolean) => {
                this._initialized = true;

                if (authenticated) {
                    this.syncLocalSession();
                    this._cleanOAuthUrl();
                }

                return authenticated;
            })
            .catch((error: unknown) => {
                this._initPromise = null;
                console.error('Keycloak init error:', error ?? 'callback OAuth invalide');
                return false;
            });
    }

    private _cleanOAuthUrl(): void {
        if (!this.isOAuthCallback()) {
            return;
        }

        window.history.replaceState(
            {},
            document.title,
            `${window.location.origin}${KEYCLOAK_REDIRECT_PATH}`
        );
    }
}
