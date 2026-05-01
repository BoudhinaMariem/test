import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpBackend, HttpClient } from '@angular/common/http';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent
{
    chatbotOpened = false;
    chatbotMessage = '';

    chatbotMessages: Array<{ from: 'bot' | 'user'; text: string }> = [
        {
            from: 'bot',
            text: 'Bonjour, je peux vous aider sur le dashboard, la planification, les retours CQ et les échéances.'
        }
    ];

    private _chatbotHttpClient: HttpClient;

    constructor(
        private _router: Router,
        private _httpBackend: HttpBackend
    )
    {
        this._chatbotHttpClient = new HttpClient(this._httpBackend);
    }

    get showChatbot(): boolean
    {
        const url = this._router.url || '';

        return !url.includes('sign-in')
            && !url.includes('sign-up')
            && !url.includes('forgot-password')
            && !url.includes('reset-password');
    }

    toggleChatbot(): void
    {
        this.chatbotOpened = !this.chatbotOpened;
    }

    sendChatbotMessage(): void
{
    const question = (this.chatbotMessage || '').trim();

    if ( !question )
    {
        return;
    }

    this.chatbotMessages.push({
        from: 'user',
        text: question
    });

    this.chatbotMessage = '';

    this.chatbotMessages.push({
        from: 'bot',
        text: 'Analyse en cours...'
    });

    this._chatbotHttpClient
    .post<any>('http://localhost:5000/api/chatbot/ask', {
        question: question
    })
        .subscribe({
            next: (response) => {
                this.chatbotMessages.pop();

                if ( response?.success === false )
                {
                    this.chatbotMessages.push({
                        from: 'bot',
                        text: response?.answer || 'Le backend a retourné une erreur.'
                    });
                    return;
                }

                this.chatbotMessages.push({
                    from: 'bot',
                    text: response?.answer || 'Aucune réponse disponible.'
                });
            },
            error: (error) => {
                console.error('Erreur chatbot frontend:', error);

                this.chatbotMessages.pop();

                const message =
                    error?.error?.answer ||
                    error?.error?.detail ||
                    error?.message ||
                    'Erreur inconnue côté frontend. Vérifie F12 > Network.';

                this.chatbotMessages.push({
                    from: 'bot',
                    text: 'Erreur appel API chatbot : ' + message
                });
            }
        });
}
}