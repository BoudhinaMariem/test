using System.Text.Json.Serialization;

namespace Triweb.Api.Models
{
    public class MlPredictionRequestDto
    {
        [JsonPropertyName("position")]
        public string Position { get; set; } = "Production";

        [JsonPropertyName("statut")]
        public string Statut { get; set; } = "En cours";

        [JsonPropertyName("loi_type")]
        public string LoiType { get; set; } = "production_standard";

        [JsonPropertyName("nature")]
        public string Nature { get; set; } = "";

        [JsonPropertyName("etatR")]
        public string EtatR { get; set; } = "";

        [JsonPropertyName("etatG")]
        public string EtatG { get; set; } = "";

        [JsonPropertyName("etatCqi")]
        public string EtatCqi { get; set; } = "";

        [JsonPropertyName("etatCqc")]
        public string EtatCqc { get; set; } = "";

        [JsonPropertyName("teamR")]
        public string TeamR { get; set; } = "";

        [JsonPropertyName("teamG")]
        public string TeamG { get; set; } = "";

        [JsonPropertyName("page")]
        public double Page { get; set; }

        [JsonPropertyName("charge")]
        public double Charge { get; set; }

        [JsonPropertyName("totalHours")]
        public double TotalHours { get; set; }

        [JsonPropertyName("dureeR_min")]
        public double DureeRMin { get; set; }

        [JsonPropertyName("dureeG_min")]
        public double DureeGMin { get; set; }

        [JsonPropertyName("dureeCqi_min")]
        public double DureeCqiMin { get; set; }

        [JsonPropertyName("dureeCqc_min")]
        public double DureeCqcMin { get; set; }

        [JsonPropertyName("jours_restants")]
        public double JoursRestants { get; set; } = 999;
    }
}