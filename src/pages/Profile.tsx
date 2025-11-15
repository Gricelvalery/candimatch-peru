import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, ThumbsUp, ThumbsDown, MapPin, Award } from 'lucide-react';

interface Profile {
  dni: string;
  full_name: string;
  voting_location?: string;
  is_poll_worker: boolean;
}

interface InteractionStats {
  likes: number;
  dislikes: number;
  topCandidates: Array<{ name: string; party: string; count: number }>;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<InteractionStats>({
    likes: 0,
    dislikes: 0,
    topCandidates: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    voting_location: '',
    is_poll_worker: false
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error('Error al cargar perfil');
      return;
    }

    setProfile(data);
    setEditData({
      voting_location: data.voting_location || '',
      is_poll_worker: data.is_poll_worker
    });
  };

  const loadStats = async () => {
    if (!user) return;

    const { data: interactions, error } = await supabase
      .from('user_interactions')
      .select(`
        interaction_type,
        candidates (name, party)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading stats:', error);
      return;
    }

    const likes = interactions?.filter(i => i.interaction_type === 'like').length || 0;
    const dislikes = interactions?.filter(i => i.interaction_type === 'dislike').length || 0;

    const candidateCount: Record<string, { name: string; party: string; count: number }> = {};
    
    interactions?.forEach(interaction => {
      if (interaction.interaction_type === 'like' && interaction.candidates) {
        const candidate = interaction.candidates as any;
        const key = candidate.name;
        if (!candidateCount[key]) {
          candidateCount[key] = {
            name: candidate.name,
            party: candidate.party,
            count: 0
          };
        }
        candidateCount[key].count++;
      }
    });

    const topCandidates = Object.values(candidateCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({ likes, dislikes, topCandidates });
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        voting_location: editData.voting_location,
        is_poll_worker: editData.is_poll_worker
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Error al actualizar perfil');
      return;
    }

    toast.success('Perfil actualizado');
    setIsEditing(false);
    loadProfile();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-peru p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-white text-center mt-4">Mi Perfil</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <div>
              <Label>DNI</Label>
              <p className="font-medium">{profile.dni}</p>
            </div>
            
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="voting-location">Lugar de Votación</Label>
                  <Input
                    id="voting-location"
                    value={editData.voting_location}
                    onChange={(e) => setEditData({ ...editData, voting_location: e.target.value })}
                    placeholder="Ej: Colegio San José, Lima"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="poll-worker"
                    checked={editData.is_poll_worker}
                    onChange={(e) => setEditData({ ...editData, is_poll_worker: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="poll-worker">Soy miembro de mesa</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateProfile}>Guardar</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lugar de Votación
                  </Label>
                  <p className="font-medium">{profile.voting_location || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Miembro de Mesa
                  </Label>
                  <Badge variant={profile.is_poll_worker ? 'default' : 'secondary'}>
                    {profile.is_poll_worker ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Editar información
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{stats.likes}</p>
                <p className="text-sm text-muted-foreground">Me gusta</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-3xl font-bold text-red-600">{stats.dislikes}</p>
                <p className="text-sm text-muted-foreground">No me gusta</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Top 5 Candidatos Preferidos</h3>
              {stats.topCandidates.length > 0 ? (
                <div className="space-y-2">
                  {stats.topCandidates.map((candidate, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.party}</p>
                      </div>
                      <Badge>{idx + 1}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aún no has dado "me gusta" a ningún candidato
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSignOut} variant="destructive" className="w-full">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Profile;
