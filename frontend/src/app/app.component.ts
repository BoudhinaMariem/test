import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  suggestions?: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  chatbotOpened = false;
  chatbotMessage = '';
  chatbotMessages: ChatMessage[] = [
    {
      from: 'bot',
      text: 'Bonjour, je peux vous aider sur le dashboard, la planification, les retours CQ et les échéances.'
    }
  ];

  askSuggestedQuestion(question: string): void {
    this.chatbotMessage = question;
    this.sendChatbotMessage();
  }


  loading = false;

  constructor(
      private _router: Router,
      private _httpClient: HttpClient
  )
  {
  }

  get showChatbot(): boolean {
    const url = this._router.url || '';
    return !url.includes('sign-in')
      && !url.includes('sign-up')
      && !url.includes('forgot-password')
      && !url.includes('reset-password');
  }

  toggleChatbot(): void {
    this.chatbotOpened = !this.chatbotOpened;
  }

  sendChatbotMessage(): void {
    const question = this.chatbotMessage?.trim();
    if (!question) return;

    // Ajouter le message utilisateur
    this.chatbotMessages.push({ from: 'user', text: question });
    this.chatbotMessage = '';
    this.loading = true;

    // Ajouter message "Analyse en cours"
    const loadingMessage: ChatMessage = { from: 'bot', text: 'Analyse en cours...' };
    this.chatbotMessages.push(loadingMessage);

    // Appel API
    this._httpClient
    .post<{
      success?: boolean;
      answer?: string;
      detail?: string;
      suggestions?: string[];
    }>(
      'http://localhost:5000/api/chatbot/ask',
      { question }
    )
    .subscribe({
      next: (response) => {
        this.removeLoadingMessage(loadingMessage);

        if (response?.success === false) {
          this.chatbotMessages.push({
            from: 'bot',
            text: response?.answer || response?.detail || 'Le chatbot a retourné une erreur.'
          });
        } else {
          this.chatbotMessages.push({
            from: 'bot',
            text: response?.answer || 'Aucune réponse disponible.',
            suggestions: response?.suggestions || []
          });
        }

        this.loading = false;
      },
      error: (error) => {
        this.removeLoadingMessage(loadingMessage);

        const message =
          error?.error?.detail ||
          error?.error?.answer ||
          error?.error?.title ||
          error?.message ||
          'Erreur inconnue côté frontend. Vérifie F12 > Network.';

        this.chatbotMessages.push({
          from: 'bot',
          text: 'Erreur API chatbot : ' + message
        });

        console.error('Erreur chatbot frontend:', error);
        this.loading = false;
      }
    });

    
  }

  private removeLoadingMessage(msg: ChatMessage) {
    const index = this.chatbotMessages.indexOf(msg);
    if (index > -1) this.chatbotMessages.splice(index, 1);
  }
}