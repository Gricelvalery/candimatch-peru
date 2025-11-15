import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CandidateCard } from '@/components/CandidateCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Vote } from 'lucide-react';

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

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadCandidates();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredCandidates(candidates);
    } else {
      setFilteredCandidates(candidates.filter(c => c.category === selectedCategory));
    }
    setCurrentIndex(0);
  }, [selectedCategory, candidates]);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Error al cargar candidatos');
      return;
    }

    setCandidates(data || []);
    setFilteredCandidates(data || []);
  };

  const handleInteraction = async (candidateId: string, type: 'like' | 'dislike') => {
    if (!user) return;

    const { error } = await supabase
      .from('user_interactions')
      .upsert({
        user_id: user.id,
        candidate_id: candidateId,
        interaction_type: type
      }, {
        onConflict: 'user_id,candidate_id'
      });

    if (error) {
      toast.error('Error al guardar interacción');
      return;
    }

    toast.success(type === 'like' ? '¡Te gusta este candidato!' : 'Candidato descartado');
    
    if (currentIndex < filteredCandidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.info('Has revisado todos los candidatos en esta categoría');
      setCurrentIndex(0);
    }
  };

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'presidente', label: 'Presidente' },
    { value: 'camara_diputados', label: 'Cámara de Diputados' },
    { value: 'camara_senadores_nacional', label: 'Senadores Nacional' },
    { value: 'camara_senadores_regional', label: 'Senadores Regional' },
    { value: 'parlamento_andino', label: 'Parlamento Andino' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Vote className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const currentCandidate = filteredCandidates[currentIndex];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-peru p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vote className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">VotoPeru</h1>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/profile')}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Perfil
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="text-sm text-muted-foreground">
            {filteredCandidates.length > 0
              ? `Candidato ${currentIndex + 1} de ${filteredCandidates.length}`
              : 'No hay candidatos en esta categoría'}
          </p>
        </div>

        {currentCandidate ? (
          <CandidateCard
            key={currentCandidate.id}
            candidate={currentCandidate}
            onLike={(id) => handleInteraction(id, 'like')}
            onDislike={(id) => handleInteraction(id, 'dislike')}
          />
        ) : (
          <div className="text-center py-20">
            <Vote className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No hay candidatos disponibles</h2>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'Aún no se han agregado candidatos a la plataforma' 
                : 'No hay candidatos en esta categoría'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
