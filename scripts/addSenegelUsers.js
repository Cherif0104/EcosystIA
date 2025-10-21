// Script pour ajouter tous les utilisateurs SENEGEL natifs
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://tdwbqgyubigaurnjzbfv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkd2JxZ3l1YmlnYXVybmp6YmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODA2NzEsImV4cCI6MjA3NjU1NjY3MX0.bmGr3gY0GFeJelVIq8xwZJ6xaZhb-L-SAhn6ypg6zzU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Liste des utilisateurs SENEGEL avec leurs rôles selon la vision MVP
const senegelUsers = [
  {
    full_name: "BADIANE Marieme",
    email: "Mariemebl3@gmail.com",
    phone_number: "77 926 24 77",
    role: "administrator",
    department: "Administration"
  },
  {
    full_name: "BODIAN Rokhaya",
    email: "rokhaya@senegel.org",
    phone_number: "77 520 32 78",
    role: "super_administrator",
    department: "Direction"
  },
  {
    full_name: "DIAGNE Amy",
    email: "Nabyaminatoul08@gmail.com",
    phone_number: "77 905 14 87",
    role: "manager",
    department: "Gestion"
  },
  {
    full_name: "DIAGNE Awa",
    email: "awadiagne1003@gmail.com",
    phone_number: "77 453 44 76",
    role: "supervisor",
    department: "Supervision"
  },
  {
    full_name: "DIALLO Adja Mame Sarr",
    email: "adjadiallo598@gmail.com",
    phone_number: "77 477 39 39",
    role: "trainer",
    department: "Formation"
  },
  {
    full_name: "DIASSE Mouhamadou Lamine",
    email: "mdiasse26@gmail.com",
    phone_number: "77 194 87 25",
    role: "implementer",
    department: "Implémentation"
  },
  {
    full_name: "DIOP Ousmane",
    email: "diopiste@yahoo.fr",
    phone_number: "77 511 97 91",
    role: "coach",
    department: "Coaching"
  },
  {
    full_name: "DRAME Bafode",
    email: "bafode.drame@senegel.org",
    phone_number: "77 650 96 68",
    role: "facilitator",
    department: "Facilitation"
  },
  {
    full_name: "FAYE Adja Bineta Sylla",
    email: "adjabsf92@gmail.com",
    phone_number: "77 484 55 80",
    role: "mentor",
    department: "Mentorat"
  },
  {
    full_name: "GNINGUE Oumar",
    email: "gningue04@gmail.com",
    phone_number: "77 768 49 99",
    role: "entrepreneur",
    department: "Entrepreneuriat"
  },
  {
    full_name: "GUINDO Mariame Diouldé",
    email: "onevisionbmca@gmail.com",
    phone_number: "77 564 44 40",
    role: "publisher",
    department: "Édition"
  },
  {
    full_name: "KEBE Rokhaya",
    email: "rokhayakebe23@gmail.com",
    phone_number: "76 194 72 04",
    role: "producer",
    department: "Production"
  },
  {
    full_name: "LY Amadou Dia",
    email: "lyamadoudia@gmail.com",
    phone_number: "+1 (971) 270-8619 / 77 884 96 92",
    role: "funder",
    department: "Finance"
  },
  {
    full_name: "NDIAYE Cheikh Mohamed",
    email: "Wowastudios@gmail.com",
    phone_number: "77 283 55 14",
    role: "artist",
    department: "Création"
  },
  {
    full_name: "NYAFOUNA Charles",
    email: "cnyafouna@gmail.com",
    phone_number: "+44 7545 341935",
    role: "administrator",
    department: "Administration"
  },
  {
    full_name: "SAMB Alioune Badara Pape",
    email: "pape@senegel.org",
    phone_number: "+1 (202) 557-4901 / 75 335 13 84",
    role: "super_administrator",
    department: "Direction"
  },
  {
    full_name: "SAMB Rokhaya",
    email: "sambrokhy700@gmail.com",
    phone_number: "77 286 33 12",
    role: "editor",
    department: "Édition"
  },
  {
    full_name: "SENE Adama Mandaw",
    email: "adamasene.fa@gmail.com",
    phone_number: "77 705 32 51",
    role: "intern",
    department: "Stages"
  },
  {
    full_name: "SENEGEL CONTACT",
    email: "contact@senegel.org",
    phone_number: "77 853 33 99 / 33 843 63 12",
    role: "administrator",
    department: "Contact"
  }
];

async function createSenegelUsers() {
  console.log('🚀 Création des utilisateurs SENEGEL natifs...');
  
  const results = [];
  
  for (const user of senegelUsers) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`⚠️  Utilisateur ${user.full_name} existe déjà`);
        results.push({ user: user.full_name, status: 'exists', data: existingUser });
        continue;
      }
      
      // Créer le profil utilisateur
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          department: user.department,
          is_native_user: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erreur création ${user.full_name}:`, error);
        results.push({ user: user.full_name, status: 'error', error });
      } else {
        console.log(`✅ Utilisateur ${user.full_name} créé avec succès`);
        results.push({ user: user.full_name, status: 'created', data: profile });
      }
      
    } catch (error) {
      console.error(`❌ Erreur pour ${user.full_name}:`, error);
      results.push({ user: user.full_name, status: 'error', error });
    }
  }
  
  console.log('\n📊 RÉSUMÉ DE LA CRÉATION:');
  console.log(`✅ Créés: ${results.filter(r => r.status === 'created').length}`);
  console.log(`⚠️  Existants: ${results.filter(r => r.status === 'exists').length}`);
  console.log(`❌ Erreurs: ${results.filter(r => r.status === 'error').length}`);
  
  return results;
}

// Exécuter le script
createSenegelUsers().then(() => {
  console.log('🎉 Script terminé !');
}).catch(console.error);
