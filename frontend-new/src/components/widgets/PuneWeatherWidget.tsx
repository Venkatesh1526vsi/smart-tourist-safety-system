import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPuneWeather } from "@/services/api";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  alert?: string;
  location: string;
  timestamp: string;
}

const PuneWeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPuneWeather();
        // Handle both wrapped {data: {...}} and direct response formats
        const weatherData = response.data || response;
        if (weatherData && typeof weatherData === 'object') {
          setWeather(weatherData as WeatherData);
        } else {
          throw new Error('Invalid weather data format');
        }
      } catch (err) {
        console.error('[PuneWeatherWidget] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    if (!condition) return <Cloud className="h-8 w-8 text-slate-400" />;
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (lower.includes('cloud')) return <Cloud className="h-8 w-8 text-slate-500" />;
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-8 w-8 text-amber-500" />;
    return <Cloud className="h-8 w-8 text-slate-400" />;
  };

  if (loading) {
    return (
      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading weather...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Weather data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getWeatherIcon(weather.condition)}
          Live Pune Weather Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weather.alert && (
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{weather.alert}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-bold">{weather.temperature ?? '--'}°C</p>
            <p className="text-sm text-muted-foreground">{weather.condition || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{weather.location || 'Pune, Maharashtra'}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>Humidity: {weather.humidity ?? '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4 text-slate-500" />
              <span>Wind: {weather.windSpeed ?? '--'} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CloudRain className="h-4 w-4 text-blue-400" />
              <span>Rain: {weather.rainProbability ?? '--'}%</span>
            </div>
          </div>
        </div>
        
        {weather.rainProbability > 50 && (
          <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ High rain probability - Carry umbrella, avoid flood-prone areas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PuneWeatherWidget;
