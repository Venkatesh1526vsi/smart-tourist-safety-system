import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
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

interface PuneWeatherWidgetProps {
  locationData?: {
    locationName: string;
    coordinates: { lat: number; lng: number } | null;
    loading: boolean;
  };
}

const PuneWeatherWidget = ({ locationData }: PuneWeatherWidgetProps) => {
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
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getWeatherIcon(weather.condition)}
            Live Weather Risk
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {weather.alert && (
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{weather.alert}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1 relative flex flex-col justify-center">
            <p className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">{weather.temperature ?? '--'}°C</p>
            <p className="text-xs sm:text-sm font-medium">{weather.condition || 'Unknown'}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 pr-2">
              {locationData?.locationName || weather.location || 'Locating...'}
            </p>
          </div>
          
          <div className="space-y-2.5 bg-muted/30 p-2 sm:p-2.5 rounded-lg border border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="h-3.5 w-3.5 text-blue-500" /> Humidity</span>
              <span className="font-semibold">{weather.humidity ?? '--'}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Wind className="h-3.5 w-3.5 text-slate-500" /> Wind</span>
              <span className="font-semibold">{weather.windSpeed ?? '--'} km/h</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><CloudRain className="h-3.5 w-3.5 text-blue-400" /> Rain Prob.</span>
              <span className="font-semibold">{weather.rainProbability ?? '--'}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> AQI</span>
              <span className="font-semibold text-amber-500">112 (Mod)</span>
            </div>
          </div>
        </div>
        
        {weather.rainProbability > 50 ? (
          <div className="mt-3 p-2.5 rounded border border-amber-500/20 bg-amber-500/10 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
              <strong>Weather Impact Advisory:</strong> High rain probability detected. Anticipate route delays and low visibility.
            </p>
          </div>
        ) : (
          <div className="mt-3 p-2.5 rounded border border-green-500/20 bg-green-500/10 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-700 dark:text-green-400 leading-tight">
              <strong>Weather Impact:</strong> Optimal travel conditions. No immediate weather threats detected in your area.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PuneWeatherWidget;
