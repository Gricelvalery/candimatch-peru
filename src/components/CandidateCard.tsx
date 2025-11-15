import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Candidate {
  id: string;
  name: string;
  photo_url: string;
  party: string;
  age: number;
  orientation: 'izquierda' | 'derecha' | 'centro';
  category: string;
  party_background?: string;
  proposals_2026?: string;
  criminal_record?: string;
  recent_news?: string[];
  projects?: string[];
}

interface CandidateCardProps {
  candidate: Candidate;
  onLike: (candidateId: string) => void;
  onDislike: (candidateId: string) => void;
}

export const CandidateCard = ({ candidate, onLike, onDislike }: CandidateCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'presidente': 'Presidente',
      'camara_diputados': 'Cámara de Diputados',
      'camara_senadores_nacional': 'Senadores Nacional',
      'camara_senadores_regional': 'Senadores Regional',
      'parlamento_andino': 'Parlamento Andino'
    };
    return labels[category] || category;
  };

  const getOrientationColor = (orientation: string) => {
    const colors: Record<string, string> = {
      'izquierda': 'bg-red-500',
      'derecha': 'bg-blue-500',
      'centro': 'bg-yellow-500'
    };
    return colors[orientation] || 'bg-gray-500';
  };

  const simplifyText = (text: string) => {
    return text; // Aquí podrías integrar una API de simplificación de texto
  };

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <div
        className={cn(
          "relative w-full h-[600px] transition-transform duration-700 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Cara frontal */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden shadow-card hover:shadow-elevated transition-shadow overflow-hidden"
          )}
        >
          <div className="relative h-full">
            <div
              className="h-2/3 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${candidate.photo_url})` }}
              onClick={() => setIsFlipped(true)}
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge className={cn("text-white", getOrientationColor(candidate.orientation))}>
                  {candidate.orientation}
                </Badge>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{candidate.name}</h2>
                <p className="text-muted-foreground">{candidate.party}</p>
                <p className="text-sm text-muted-foreground">{candidate.age} años</p>
              </div>
              
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(candidate.category)}
              </Badge>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => onDislike(candidate.id)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <ThumbsDown className="mr-2 h-5 w-5" />
                  No
                </Button>
                <Button
                  onClick={() => onLike(candidate.id)}
                  size="lg"
                  className="flex-1 bg-gradient-peru"
                >
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  Sí
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cara trasera */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 shadow-card overflow-y-auto"
          )}
        >
          <div className="p-6 space-y-4">
            <Button
              variant="ghost"
              onClick={() => setIsFlipped(false)}
              className="mb-4"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            
            <div>
              <h3 className="font-bold text-lg mb-2">Antecedentes del Partido</h3>
              <p className="text-sm text-muted-foreground">
                {candidate.party_background || 'No disponible'}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Propuestas 2026</h3>
              <p className="text-sm text-muted-foreground">
                {showSimplified && candidate.proposals_2026
                  ? simplifyText(candidate.proposals_2026)
                  : candidate.proposals_2026 || 'No disponible'}
              </p>
              {candidate.proposals_2026 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowSimplified(!showSimplified)}
                  className="px-0 mt-2"
                >
                  {showSimplified ? 'Ver original' : 'Simplificar'}
                </Button>
              )}
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Antecedentes Penales</h3>
              <p className="text-sm text-muted-foreground">
                {candidate.criminal_record || 'Sin antecedentes'}
              </p>
            </div>

            {candidate.recent_news && candidate.recent_news.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-2">Noticias Recientes</h3>
                <ul className="space-y-2">
                  {candidate.recent_news.map((news, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      • {news}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidate.projects && candidate.projects.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-2">Proyectos</h3>
                <ul className="space-y-2">
                  {candidate.projects.map((project, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      • {project}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};
