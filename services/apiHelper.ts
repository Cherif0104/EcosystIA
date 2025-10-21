// Helper pour les appels API REST Supabase
export class ApiHelper {
  private static baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tdwbqgyubigaurnjzbfv.supabase.co';
  private static apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkd2JxZ3l1YmlnYXVybmp6YmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODA2NzEsImV4cCI6MjA3NjU1NjY3MX0.bmGr3gY0GFeJelVIq8xwZJ6xaZhb-L-SAhn6ypg6zzU';

  // Headers communs pour tous les appels API
  private static getHeaders() {
    return {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // GET request
  static async get(endpoint: string, params?: Record<string, any>) {
    try {
      let url = `${this.baseUrl}/rest/v1/${endpoint}`;
      
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
        url += `?${searchParams.toString()}`;
      }

      console.log(`🔍 API GET: ${url}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 API GET ${endpoint} - Résultat:`, data?.length || 0, 'éléments');
      return { data, error: null };
    } catch (error) {
      console.error(`❌ Erreur API GET ${endpoint}:`, error);
      return { data: null, error };
    }
  }

  // POST request
  static async post(endpoint: string, payload: any) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}`;
      
      console.log(`🔍 API POST: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      const data = await response.json();
      console.log(`✅ API POST ${endpoint} - Créé:`, data[0]?.id);
      return { data: data[0], error: null };
    } catch (error) {
      console.error(`❌ Erreur API POST ${endpoint}:`, error);
      return { data: null, error };
    }
  }

  // PUT request
  static async put(endpoint: string, id: string, payload: any) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}?id=eq.${id}`;
      
      console.log(`🔍 API PUT: ${url}`);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...this.getHeaders(),
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      const data = await response.json();
      console.log(`✅ API PUT ${endpoint} - Mis à jour:`, data[0]?.id);
      return { data: data[0], error: null };
    } catch (error) {
      console.error(`❌ Erreur API PUT ${endpoint}:`, error);
      return { data: null, error };
    }
  }

  // DELETE request
  static async delete(endpoint: string, id: string) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}?id=eq.${id}`;
      
      console.log(`🔍 API DELETE: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      console.log(`✅ API DELETE ${endpoint} - Supprimé:`, id);
      return { error: null };
    } catch (error) {
      console.error(`❌ Erreur API DELETE ${endpoint}:`, error);
      return { error };
    }
  }
}
