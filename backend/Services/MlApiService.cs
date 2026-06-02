using System.Net.Http.Json;
using Triweb.Api.Models;

namespace Triweb.Api.Services
{
    public class MlApiService
    {
        private readonly HttpClient _httpClient;

        public MlApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> HealthAsync()
        {
            var response = await _httpClient.GetAsync("/health");
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"FastAPI health error {(int)response.StatusCode}: {content}");
            }

            return content;
        }

        public async Task<string> PredictAllAsync(MlPredictionRequestDto payload)
        {
            var response = await _httpClient.PostAsJsonAsync("/predict/all", payload);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"FastAPI predict/all error {(int)response.StatusCode}: {content}");
            }

            return content;
        }

        public async Task<string> PredictRetardAsync(MlPredictionRequestDto payload)
        {
            var response = await _httpClient.PostAsJsonAsync("/predict/retard", payload);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"FastAPI predict/retard error {(int)response.StatusCode}: {content}");
            }

            return content;
        }

        public async Task<string> PredictChargeAsync(MlPredictionRequestDto payload)
        {
            var response = await _httpClient.PostAsJsonAsync("/predict/charge", payload);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"FastAPI predict/charge error {(int)response.StatusCode}: {content}");
            }

            return content;
        }

        public async Task<string> PredictAffectationAsync(MlPredictionRequestDto payload)
        {
            var response = await _httpClient.PostAsJsonAsync("/predict/affectation", payload);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"FastAPI predict/affectation error {(int)response.StatusCode}: {content}");
            }

            return content;
        }
    }
}