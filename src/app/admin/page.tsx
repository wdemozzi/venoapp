'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Star,
  X,
  Save,
  RefreshCw,
  Zap,
  Landmark,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Images,
  ExternalLink,
  Megaphone,
  Layers,
  Heart,
  CreditCard,
  DollarSign,
  Search,
  MessageSquare,
  Phone,
  Store,
  Globe,
  Mail,
  Upload,
  ImageIcon,
  Tag,
  Lock,
  Key,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import InstagramIcon from '@/components/InstagramIcon';
import {
  supabase,
  City,
  Event as SupabaseEvent,
  Business as SupabaseBusiness,
  CityShortcut,
  EventAlbum,
  EventPhoto,
  getAlbumsByCity,
  CityBanner,
  BannersConfig,
  Plan,
  Offer,
  getOffersByCity,
  createOffer,
  deleteOffer,
  DEFAULT_PLANS,
  DEFAULT_CITIES,
  parseBusinessMetadata,
  formatBusinessDescriptionWithMetadata,
  AdminSession,
  authenticateAdmin,
  updateBusinessAccessCredentials,
} from '@/lib/supabase';
import defaultBannersData from '@/data/banners.json';

const DEFAULT_CITY_ID = '48d98d79-bafe-460f-9a5f-dd5dc04e85ed';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'city' | 'events' | 'businesses' | 'offers' | 'shortcuts' | 'albums' | 'banners' | 'subscriptions' | 'franchises'>('events');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Security Authentication Lock State & Scope
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // User Access Modal State for Businesses (/portal-parceiro)
  const [userAccessModal, setUserAccessModal] = useState<{
    open: boolean;
    business: SupabaseBusiness | null;
    email: string;
    password: string;
    username: string;
    saving: boolean;
  }>({
    open: false,
    business: null,
    email: '',
    password: '',
    username: '',
    saving: false,
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('venoapp_admin_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (!parsed.timestamp || Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000)) {
            if (parsed.role) {
              setAdminSession(parsed);
              setIsAuthenticated(true);
              if (parsed.role === 'franchisee' && parsed.cityId) {
                setSelectedCityId(parsed.cityId);
              }
            } else {
              // Backward compatibility
              const fallback: AdminSession = {
                role: 'superadmin',
                username: 'demozzi',
                name: 'Demozzi (Franqueadora Master)',
                timestamp: parsed.timestamp || Date.now(),
              };
              setAdminSession(fallback);
              setIsAuthenticated(true);
            }
          }
        }
      }
    } catch {}
    setAuthChecked(true);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const session = authenticateAdmin(adminUserInput, adminPasswordInput);
    if (session) {
      setAdminSession(session);
      setIsAuthenticated(true);
      setAuthError('');
      if (session.role === 'franchisee' && session.cityId) {
        setSelectedCityId(session.cityId);
        refreshData(session.cityId);
      }
      if (rememberMe) {
        try {
          window.localStorage.setItem('venoapp_admin_auth', JSON.stringify(session));
        } catch {}
      }
    } else {
      // Legacy PIN fallback
      const cleanU = adminUserInput.trim().toLowerCase();
      const cleanP = adminPasswordInput.trim().toLowerCase();
      const validPins = ['admin2026', 'veno2026', '2026', 'admin'];
      if (validPins.includes(cleanU) || validPins.includes(cleanP)) {
        const fallbackSession: AdminSession = {
          role: 'superadmin',
          username: 'demozzi',
          name: 'Demozzi (Franqueadora Master)',
          timestamp: Date.now(),
        };
        setAdminSession(fallbackSession);
        setIsAuthenticated(true);
        setAuthError('');
        if (rememberMe) {
          try {
            window.localStorage.setItem('venoapp_admin_auth', JSON.stringify(fallbackSession));
          } catch {}
        }
        return;
      }
      setAuthError('Usuário ou senha incorretos. Use "demozzi" ou o usuário da sua franquia.');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setAdminSession(null);
    setAdminUserInput('');
    setAdminPasswordInput('');
    try {
      window.localStorage.removeItem('venoapp_admin_auth');
    } catch {}
  };

  const handleOpenUserAccessModal = (bus: SupabaseBusiness) => {
    setUserAccessModal({
      open: true,
      business: bus,
      email: bus.access_email || `${bus.slug || 'contato'}@venoapp.com`,
      password: bus.access_password || '123456',
      username: bus.access_user || bus.slug || '',
      saving: false,
    });
  };

  const handleSaveUserAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccessModal.business || !userAccessModal.business.id) return;
    if (!userAccessModal.email || !userAccessModal.password) {
      showToast('Preencha o e-mail e a senha de acesso.', 'error');
      return;
    }
    setUserAccessModal((prev) => ({ ...prev, saving: true }));
    try {
      const success = await updateBusinessAccessCredentials(userAccessModal.business.id, {
        email: userAccessModal.email,
        password: userAccessModal.password,
        username: userAccessModal.username || userAccessModal.email.split('@')[0],
      });
      if (!success) throw new Error('Falha ao salvar credenciais.');
      showToast(`Acesso configurado para "${userAccessModal.business.name}" com sucesso!`);
      setUserAccessModal((prev) => ({ ...prev, open: false, business: null }));
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar credenciais';
      showToast(msg, 'error');
    } finally {
      setUserAccessModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Multi-tenant city states
  const [availableCities, setAvailableCities] = useState<City[]>(DEFAULT_CITIES);
  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITY_ID);

  // Data states
  const [city, setCity] = useState<City>(DEFAULT_CITIES[0]);
  const [events, setEvents] = useState<SupabaseEvent[]>([]);
  const [businesses, setBusinesses] = useState<SupabaseBusiness[]>([]);
  const [shortcuts, setShortcuts] = useState<CityShortcut[]>([]);
  const [albums, setAlbums] = useState<EventAlbum[]>([]);
  const [banners, setBanners] = useState<BannersConfig>(defaultBannersData as unknown as BannersConfig);
  const [bannersSaving, setBannersSaving] = useState(false);
  const [adModal, setAdModal] = useState<{ open: boolean; ad: Partial<CityBanner> | null; index?: number }>({
    open: false,
    ad: null,
  });
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [subSearch, setSubSearch] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  const [franchiseModal, setFranchiseModal] = useState({
    open: false,
    city: {
      name: '',
      state: 'PR',
      slug: '',
      headline: '',
      hero_image: '',
      franchisee_name: '',
      franchisee_email: '',
      franchisee_phone: '',
      status: 'active',
    },
    submitting: false,
  });

  // Modals state
  const [eventModal, setEventModal] = useState<{ open: boolean; event: Partial<SupabaseEvent> | null }>({ open: false, event: null });
  const [businessModal, setBusinessModal] = useState<{ open: boolean; business: Partial<SupabaseBusiness> | null }>({ open: false, business: null });
  const [shortcutModal, setShortcutModal] = useState<{ open: boolean; shortcut: Partial<CityShortcut> | null }>({ open: false, shortcut: null });
  const [albumModal, setAlbumModal] = useState<{ open: boolean; album: Partial<EventAlbum> | null }>({ open: false, album: null });
  const [photosManagerModal, setPhotosManagerModal] = useState<{
    open: boolean;
    album: EventAlbum | null;
    photos: EventPhoto[];
    newPhotoUrl: string;
    newPhotoCaption: string;
    isAdding: boolean;
  }>({
    open: false,
    album: null,
    photos: [],
    newPhotoUrl: '',
    newPhotoCaption: '',
    isAdding: false,
  });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerModal, setOfferModal] = useState<{ open: boolean; offer: Partial<Offer> | null }>({ open: false, offer: null });
  const [uploadingOfferPhoto, setUploadingOfferPhoto] = useState(false);
  const offerFileInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'event' | 'business' | 'shortcut' | 'album' | 'offer'; id: string; name: string }>({
    open: false,
    type: 'event',
    id: '',
    name: '',
  });

  const [uploadingBusinessPhoto, setUploadingBusinessPhoto] = useState(false);
  const businessFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleBusinessFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBusinessPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Falha no upload da foto');
      }

      setBusinessModal((prev) => ({
        ...prev,
        business: {
          ...prev.business,
          cover_url: data.url,
        },
      }));
      showToast('Foto carregada com sucesso do computador!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar arquivo.', 'error');
    } finally {
      setUploadingBusinessPhoto(false);
      if (businessFileInputRef.current) {
        businessFileInputRef.current.value = '';
      }
    }
  };

  const handleOfferFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOfferPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Falha no upload da imagem do cupom');
      }

      setOfferModal((prev) => ({
        ...prev,
        offer: {
          ...prev.offer,
          image_url: data.url,
        },
      }));
      showToast('Foto do cupom carregada com sucesso do computador!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar foto.', 'error');
    } finally {
      setUploadingOfferPhoto(false);
      if (offerFileInputRef.current) {
        offerFileInputRef.current.value = '';
      }
    }
  };

  // Fetch all data scoped by active city
  const refreshData = useCallback(async (forcedCityId?: string) => {
    setLoading(true);
    try {
      // 1. Carrega lista de cidades de /api/cities
      let currentCities = availableCities;
      try {
        const cRes = await fetch('/api/cities');
        const cJson = await cRes.json();
        if (Array.isArray(cJson) && cJson.length > 0) {
          setAvailableCities(cJson);
          currentCities = cJson;
        }
      } catch {
        // fallback
      }

      const activeCityId = (adminSession?.role === 'franchisee' && adminSession.cityId)
        ? adminSession.cityId
        : (forcedCityId || selectedCityId);
      const activeCityObj = currentCities.find((c) => c.id === activeCityId) || currentCities[0];
      setCity(activeCityObj);
      setSelectedCityId(activeCityObj.id);

      // 2. Carrega dados estritamente filtrados pelo city_id da cidade ativa
      const [evRes, busRes, shortRes, albumsData, plansRes, offersData] = await Promise.all([
        supabase.from('events').select('*').eq('city_id', activeCityObj.id).order('start_date', { ascending: true }),
        supabase.from('businesses').select('*').eq('city_id', activeCityObj.id).order('name', { ascending: true }),
        supabase.from('city_shortcuts').select('*').eq('city_id', activeCityObj.id).order('order_index', { ascending: true }),
        getAlbumsByCity(activeCityObj.id),
        supabase.from('plans').select('*').order('order_index', { ascending: true }),
        getOffersByCity(activeCityObj.id),
      ]);

      if (evRes.data) setEvents(evRes.data);
      else setEvents([]);
      if (busRes.data) setBusinesses(busRes.data.map(parseBusinessMetadata));
      else setBusinesses([]);
      if (shortRes.data) setShortcuts(shortRes.data);
      else setShortcuts([]);
      if (albumsData) setAlbums(albumsData);
      else setAlbums([]);
      if (plansRes.data && plansRes.data.length > 0) setPlans(plansRes.data);
      if (offersData) setOffers(offersData);
      else setOffers([]);

      fetch('/api/banners')
        .then((r) => r.json())
        .then((bData) => {
          if (bData && bData.sidebar_top) setBanners(bData);
        })
        .catch(() => {});
    } catch (err: unknown) {
      console.error('Falha ao carregar dados:', err);
      showToast('Erro ao carregar dados da cidade', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCityId, availableCities, adminSession]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        refreshData();
      }
    });
    return () => {
      ignore = true;
    };
  }, [refreshData]);

  const handleChangeCity = (newCityId: string) => {
    if (adminSession?.role === 'franchisee') {
      showToast('Acesso restrito à praça de sua franquia.', 'error');
      return;
    }
    setSelectedCityId(newCityId);
    refreshData(newCityId);
    const target = availableCities.find((c) => c.id === newCityId);
    if (target) {
      showToast(`Praça alterada para ${target.name} - ${target.state || 'PR'}`);
    }
  };

  const handleCreateFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    setFranchiseModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(franchiseModal.city),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erro ao criar franquia.');

      showToast(`Franquia de ${franchiseModal.city.name} cadastrada com sucesso!`);
      setFranchiseModal({
        open: false,
        city: {
          name: '',
          state: 'PR',
          slug: '',
          headline: '',
          hero_image: '',
          franchisee_name: '',
          franchisee_email: '',
          franchisee_phone: '',
          status: 'active',
        },
        submitting: false,
      });

      if (data.city) {
        handleChangeCity(data.city.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar franquia';
      showToast(msg, 'error');
      setFranchiseModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ==========================================
  // CITY CRUD
  // ==========================================
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('cities').upsert({
        id: city.id || DEFAULT_CITY_ID,
        slug: city.slug || 'umuarama-pr',
        name: city.name,
        state: city.state,
        headline: city.headline,
        hero_image: city.hero_image,
      });

      if (error) {
        showToast('Erro ao salvar cidade: ' + error.message, 'error');
      } else {
        showToast('Configurações da cidade salvas com sucesso!');
        refreshData();
      }
    } catch {
      showToast('Erro ao salvar configurações da cidade.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EVENT CRUD
  // ==========================================
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = eventModal.event;
    if (!item || !item.title) {
      showToast('Informe pelo menos o título do evento.', 'error');
      return;
    }

    try {
      if (item.id) {
        // Update
        const { error } = await supabase
          .from('events')
          .update({
            title: item.title,
            start_date: item.start_date || new Date().toISOString(),
            location_name: item.location_name,
            banner_url: item.banner_url,
            is_highlight: Boolean(item.is_highlight),
            is_free: Boolean(item.is_free),
            ticket_url: item.ticket_url,
          })
          .eq('id', item.id);

        if (error) throw error;
        showToast('Evento atualizado com sucesso!');
      } else {
        // Insert
        const { error } = await supabase.from('events').insert({
          city_id: city.id || DEFAULT_CITY_ID,
          title: item.title,
          start_date: item.start_date || new Date().toISOString(),
          location_name: item.location_name || 'Umuarama',
          banner_url: item.banner_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
          is_highlight: Boolean(item.is_highlight),
          is_free: Boolean(item.is_free),
          ticket_url: item.ticket_url,
        });

        if (error) throw error;
        showToast('Novo evento criado com sucesso!');
      }
      setEventModal({ open: false, event: null });
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar evento no Supabase.';
      showToast(errorMsg, 'error');
    }
  };

  const toggleEventHighlight = async (ev: SupabaseEvent) => {
    const newValue = !ev.is_highlight;
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, is_highlight: newValue } : e)));
    const { error } = await supabase.from('events').update({ is_highlight: newValue }).eq('id', ev.id);
    if (error) {
      showToast('Erro ao atualizar destaque: ' + error.message, 'error');
      refreshData();
    } else {
      showToast(`Evento "${ev.title}" ${newValue ? 'marcado como destaque' : 'removido dos destaques'}!`);
    }
  };

  // ==========================================
  // BUSINESS CRUD
  // ==========================================
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = businessModal.business;
    if (!item || !item.name) {
      showToast('Informe pelo menos o nome da empresa.', 'error');
      return;
    }

    try {
      const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const fullDescription = formatBusinessDescriptionWithMetadata(item.description || '', {
        instagram: item.instagram,
        website: item.website,
      });

      if (item.id) {
        // Update
        const { error } = await supabase
          .from('businesses')
          .update({
            name: item.name,
            slug,
            description: fullDescription,
            address: item.address,
            phone: item.phone,
            whatsapp: item.whatsapp,
            rating: item.rating ? Number(item.rating) : 5.0,
            cover_url: item.cover_url,
            is_featured: Boolean(item.is_featured),
            is_verified: Boolean(item.is_verified),
          })
          .eq('id', item.id);

        if (error) throw error;
        showToast('Empresa atualizada com sucesso!');
      } else {
        // Insert
        const { error } = await supabase.from('businesses').insert({
          city_id: city.id || DEFAULT_CITY_ID,
          name: item.name,
          slug,
          description: fullDescription || 'Comércio Local',
          address: item.address || 'Umuarama - PR',
          phone: item.phone,
          whatsapp: item.whatsapp,
          rating: item.rating ? Number(item.rating) : 5.0,
          cover_url: item.cover_url,
          is_featured: Boolean(item.is_featured),
          is_verified: Boolean(item.is_verified),
        });

        if (error) throw error;
        showToast('Empresa cadastrada com sucesso!');
      }
      setBusinessModal({ open: false, business: null });
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar empresa no Supabase.';
      showToast(errorMsg, 'error');
    }
  };

  const toggleBusinessProperty = async (bus: SupabaseBusiness, field: 'is_featured' | 'is_verified') => {
    const newValue = !bus[field];
    setBusinesses((prev) => prev.map((b) => (b.id === bus.id ? { ...b, [field]: newValue } : b)));
    const { error } = await supabase.from('businesses').update({ [field]: newValue }).eq('id', bus.id);
    if (error) {
      showToast('Erro ao atualizar: ' + error.message, 'error');
      refreshData();
    } else {
      showToast(`Empresa "${bus.name}" atualizada!`);
    }
  };

  const handleUpdateSubscriptionStatus = async (businessId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ subscription_status: status })
        .eq('id', businessId);
      if (error) throw error;
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, subscription_status: status } : b))
      );
      showToast('Status da assinatura atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar status';
      showToast(msg, 'error');
    }
  };

  const handleUpdateSubscriptionPlan = async (businessId: string, planId: string) => {
    try {
      const selectedP = plans.find((p) => p.id === planId);
      const isVip = selectedP?.slug === 'destaque-vip' || selectedP?.slug === 'master';
      const isMaster = selectedP?.slug === 'master';

      const { error } = await supabase
        .from('businesses')
        .update({
          plan_id: planId,
          is_verified: isVip,
          is_featured: isMaster,
        })
        .eq('id', businessId);
      if (error) throw error;
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === businessId
            ? { ...b, plan_id: planId, is_verified: isVip, is_featured: isMaster }
            : b
        )
      );
      showToast('Plano comercial atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar plano';
      showToast(msg, 'error');
    }
  };

  // ==========================================
  // OFFER / COUPON CRUD
  // ==========================================
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = offerModal.offer;
    if (!item || !item.title || !item.business_id || !item.coupon_code) {
      showToast('Selecione a empresa e preencha o título e o código do cupom.', 'error');
      return;
    }

    try {
      await createOffer({
        business_id: item.business_id,
        city_id: city.id || DEFAULT_CITY_ID,
        title: item.title.trim(),
        discount_percentage: Number(item.discount_percentage || 15),
        coupon_code: item.coupon_code.trim().toUpperCase(),
        valid_until: item.valid_until ? new Date(item.valid_until).toISOString() : new Date(Date.now() + 86400000 * 30).toISOString(),
        image_url: item.image_url ? item.image_url.trim() : null,
      });

      showToast('Cupom promocional cadastrado com sucesso!');
      setOfferModal({ open: false, offer: null });
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar cupom.';
      showToast(msg, 'error');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteOffer(offerId);
      showToast('Cupom excluído com sucesso!');
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir cupom.', 'error');
    }
  };

  // ==========================================
  // SHORTCUT CRUD
  // ==========================================
  const handleSaveShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = shortcutModal.shortcut;
    if (!item || !item.title) {
      showToast('Informe o título do atalho.', 'error');
      return;
    }

    try {
      if (item.id) {
        // Update
        const { error } = await supabase
          .from('city_shortcuts')
          .update({
            title: item.title,
            subtitle: item.subtitle,
            icon: item.icon || 'PhoneCall',
            link_url: item.link_url || '#',
            order_index: item.order_index ? Number(item.order_index) : 1,
          })
          .eq('id', item.id);

        if (error) throw error;
        showToast('Atalho atualizado com sucesso!');
      } else {
        // Insert
        const { error } = await supabase.from('city_shortcuts').insert({
          city_id: city.id || DEFAULT_CITY_ID,
          title: item.title,
          subtitle: item.subtitle || '',
          icon: item.icon || 'PhoneCall',
          link_url: item.link_url || '#',
          order_index: item.order_index ? Number(item.order_index) : (shortcuts.length + 1),
        });

        if (error) throw error;
        showToast('Novo atalho adicionado com sucesso!');
      }
      setShortcutModal({ open: false, shortcut: null });
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar atalho no Supabase.';
      showToast(errorMsg, 'error');
    }
  };

  // ==========================================
  // ALBUMS & PHOTOS CRUD
  // ==========================================
  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = albumModal.album;
    if (!item || !item.title) {
      showToast('Informe o título da cobertura.', 'error');
      return;
    }

    try {
      if (item.id) {
        // Update
        const { error } = await supabase
          .from('event_albums')
          .update({
            title: item.title,
            event_date: item.event_date || new Date().toISOString().slice(0, 10),
            photographer_name: item.photographer_name || '',
            cover_image_url: item.cover_image_url || '',
            event_id: item.event_id || null,
          })
          .eq('id', item.id);

        if (error) throw error;
        showToast('Cobertura atualizada com sucesso!');
      } else {
        // Insert
        const { error } = await supabase.from('event_albums').insert({
          city_id: city.id || DEFAULT_CITY_ID,
          title: item.title,
          event_date: item.event_date || new Date().toISOString().slice(0, 10),
          photographer_name: item.photographer_name || 'Venoapp Fotos',
          cover_image_url:
            item.cover_image_url ||
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
          event_id: item.event_id || null,
        });

        if (error) throw error;
        showToast('Nova cobertura criada com sucesso!');
      }
      setAlbumModal({ open: false, album: null });
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar cobertura.';
      showToast(errorMsg, 'error');
    }
  };

  const handleOpenPhotosManager = async (album: EventAlbum) => {
    try {
      const { data, error } = await supabase
        .from('event_photos')
        .select('*')
        .eq('album_id', album.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPhotosManagerModal({
        open: true,
        album,
        photos: data || [],
        newPhotoUrl: '',
        newPhotoCaption: '',
        isAdding: false,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar fotos do álbum.';
      showToast(errorMsg, 'error');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photosManagerModal.album || !photosManagerModal.newPhotoUrl.trim()) {
      showToast('Cole o link da foto para adicionar.', 'error');
      return;
    }

    try {
      setPhotosManagerModal((prev) => ({ ...prev, isAdding: true }));
      const { data, error } = await supabase
        .from('event_photos')
        .insert({
          album_id: photosManagerModal.album.id,
          photo_url: photosManagerModal.newPhotoUrl.trim(),
          caption: photosManagerModal.newPhotoCaption.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('Foto adicionada com sucesso!');
      setPhotosManagerModal((prev) => ({
        ...prev,
        photos: [...prev.photos, data],
        newPhotoUrl: '',
        newPhotoCaption: '',
        isAdding: false,
      }));
      refreshData();
    } catch (err: unknown) {
      setPhotosManagerModal((prev) => ({ ...prev, isAdding: false }));
      const errorMsg = err instanceof Error ? err.message : 'Erro ao adicionar foto.';
      showToast(errorMsg, 'error');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.from('event_photos').delete().eq('id', photoId);
      if (error) throw error;

      setPhotosManagerModal((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== photoId),
      }));
      showToast('Foto removida!');
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao excluir foto.';
      showToast(errorMsg, 'error');
    }
  };

  // ==========================================
  // BANNERS CRUD
  // ==========================================
  const handleSaveBanners = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBannersSaving(true);
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banners),
      });
      if (!res.ok) throw new Error('Falha ao salvar banners.');
      showToast('Configurações de banners salvas com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar banners';
      showToast(msg, 'error');
    } finally {
      setBannersSaving(false);
    }
  };

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adModal.ad || !adModal.ad.title) {
      showToast('Informe o título do anúncio lateral.', 'error');
      return;
    }

    const newAd: CityBanner = {
      id: adModal.ad.id || `ad-${Date.now()}`,
      position: 'sidebar_ad',
      title: adModal.ad.title,
      subtitle: adModal.ad.subtitle || '',
      button_text: adModal.ad.button_text || 'Ver mais',
      link_url: adModal.ad.link_url || '#',
      image_url:
        adModal.ad.image_url ||
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600',
      is_active: adModal.ad.is_active !== false,
      order_index: (banners.sidebar_ads || []).length + 1,
    };

    const updatedAds = [...(banners.sidebar_ads || [])];
    if (adModal.index !== undefined && adModal.index >= 0) {
      updatedAds[adModal.index] = newAd;
    } else {
      updatedAds.push(newAd);
    }

    const newConfig: BannersConfig = { ...banners, sidebar_ads: updatedAds };
    setBanners(newConfig);
    setAdModal({ open: false, ad: null });
    showToast('Anúncio lateral atualizado! Clique em "Salvar Banners" para publicar.');
  };

  const handleDeleteAd = (index: number) => {
    const updatedAds = banners.sidebar_ads.filter((_, idx) => idx !== index);
    setBanners({ ...banners, sidebar_ads: updatedAds });
    showToast('Anúncio removido! Clique em "Salvar Banners" para confirmar.');
  };

  // ==========================================
  // GENERIC DELETE CONFIRMATION
  // ==========================================
  const handleDeleteConfirm = async () => {
    const { type, id } = deleteConfirm;
    if (!id) return;

    try {
      let table = '';
      if (type === 'event') table = 'events';
      if (type === 'business') table = 'businesses';
      if (type === 'shortcut') table = 'city_shortcuts';
      if (type === 'album') {
        await supabase.from('event_photos').delete().eq('album_id', id);
        table = 'event_albums';
      }

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      showToast('Registro excluído com sucesso!');
      setDeleteConfirm({ open: false, type: 'event', id: '', name: '' });
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'falha no Supabase';
      showToast('Erro ao excluir: ' + errorMsg, 'error');
    }
  };

  if (!isAuthenticated && authChecked) {
    return (
      <div className="min-h-screen bg-[#0f041c] text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#18062b] border border-purple-800/50 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Lock className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Acesso Administrativo
            </h1>
            <p className="text-xs text-purple-200/70">
              Painel de Gestão e Franquias do Venoapp. Digite o Usuário e Senha para continuar.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 uppercase tracking-wider">
                Usuário ou E-mail
              </label>
              <input
                type="text"
                value={adminUserInput}
                onChange={(e) => setAdminUserInput(e.target.value)}
                placeholder="Ex: demozzi ou cianorte"
                autoFocus
                required
                className="w-full bg-[#250a41] border border-purple-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Digite sua senha..."
                  required
                  className="w-full bg-[#250a41] border border-purple-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono tracking-wider pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-purple-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-purple-700 bg-purple-950/60 text-purple-600 focus:ring-purple-500"
              />
              <span>Lembrar acesso neste dispositivo</span>
            </label>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-purple-950 transition transform hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Acessar Painel</span>
            </button>
          </form>

          <div className="pt-2 border-t border-purple-900/40 text-center space-y-3">
            <div className="bg-purple-950/60 border border-purple-800/40 rounded-xl p-3 text-[11px] text-purple-300 text-left space-y-1">
              <p className="font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Acessos Rápidos do Sistema:</span>
              </p>
              <p className="text-purple-300/80">
                • <strong>Master Nacional:</strong> <code className="text-purple-200 font-mono">demozzi</code> / <code className="text-purple-200 font-mono">Rest2710#</code>
              </p>
              <p className="text-purple-300/80">
                • <strong>Franquia Cianorte:</strong> <code className="text-purple-200 font-mono">cianorte</code> / <code className="text-purple-200 font-mono">Rest2710#</code>
              </p>
              <p className="text-purple-300/80">
                • <strong>Franquia Maringá:</strong> <code className="text-purple-200 font-mono">maringa</code> / <code className="text-purple-200 font-mono">Rest2710#</code>
              </p>
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white hover:underline transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Portal Público</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f041c] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-indigo-950/90 text-indigo-200 border-indigo-800'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-80 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#1b0730] border-b border-[#301254] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 px-3 py-1.5 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Portal</span>
            </Link>

            <div className="h-5 w-px bg-purple-900/60 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">
                veno<span className="text-purple-400">app</span>
              </span>
              <span className="text-xs bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visual Franchise / City Selector */}
            {adminSession?.role === 'franchisee' ? (
              <div className="flex items-center gap-2 bg-[#290d48] border border-amber-600/60 rounded-xl px-3 py-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-amber-300/80 uppercase font-bold tracking-wider leading-none">
                    Franquia Exclusiva
                  </span>
                  <span className="text-white font-bold text-xs">
                    {adminSession.cityName || city.name} ({city.state || 'PR'})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#290d48] border border-purple-700/60 rounded-xl px-3 py-1.5 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-300/70 uppercase font-bold tracking-wider leading-none">
                    {adminSession?.role === 'superadmin' ? '👑 Master • Selecionar Praça' : 'Franquia Ativa'}
                  </span>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleChangeCity(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    {availableCities.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#1b0730] text-white">
                        {c.name} - {c.state || 'PR'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Link
              href={`/${city.slug}`}
              target="_blank"
              title="Ver portal desta cidade"
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-800/40 text-purple-300 hover:text-white transition cursor-pointer hidden sm:flex items-center gap-1.5 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver no site</span>
            </Link>

            <button
              onClick={() => refreshData()}
              disabled={loading}
              title="Recarregar dados"
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-800/40 text-purple-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              onClick={handleAdminLogout}
              title="Bloquear painel e sair"
              className="p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/50 text-rose-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar / Tabs */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <nav className="bg-[#1b0730] border border-[#301254] rounded-2xl p-2.5 space-y-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Eventos</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('businesses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'businesses'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Empresas</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {businesses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Planos & Assinantes</span>
              </div>
              <span className="text-xs bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-mono font-bold">
                {businesses.filter((b) => b.subscription_status === 'active' || b.plan_id).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'offers'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-pink-400" />
                <span>Cupons & Ofertas</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {offers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('albums')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'albums'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4" />
                <span>Cobertura de Fotos</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {albums.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'shortcuts'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4" />
                <span>Atalhos Rápidos</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {shortcuts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4" />
                <span>Banners & Publicidade</span>
              </div>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                {(banners.sidebar_ads?.length || 0) + 2}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('city')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'city'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4" />
                <span>Geral da Cidade</span>
              </div>
            </button>

            {adminSession?.role !== 'franchisee' && (
              <button
                onClick={() => setActiveTab('franchises')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'franchises'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Franquias & Cidades</span>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {availableCities.length}
                </span>
              </button>
            )}
          </nav>

          {/* Quick Help Card */}
          <div className="bg-purple-950/40 border border-purple-900/40 rounded-2xl p-4 text-xs text-purple-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Sincronização Ao Vivo</span>
            </div>
            <p className="leading-relaxed text-purple-300/80">
              Todas as alterações feitas aqui são sincronizadas instantaneamente com o banco Supabase e exibidas no portal.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#160627] border border-[#2d0f50] rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* ======================================================== */}
          {/* 1. TAB: EVENTOS */}
          {/* ======================================================== */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-400" />
                    <span>Gerenciar Eventos</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Cadastre e gerencie os shows, festivais e eventos da cidade.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEventModal({
                      open: true,
                      event: {
                        title: '',
                        start_date: new Date().toISOString().slice(0, 16),
                        location_name: 'Parque de Exposições',
                        banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
                        is_highlight: false,
                        is_free: false,
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Evento</span>
                </button>
              </div>

              {/* Events List */}
              {events.length === 0 ? (
                <div className="text-center py-16 text-purple-300/60 text-sm">
                  Nenhum evento cadastrado no momento. Clique em &ldquo;Novo Evento&rdquo; acima.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-[#200839] border border-purple-900/50 rounded-2xl overflow-hidden hover:border-purple-600/60 transition group flex flex-col justify-between"
                    >
                      <div>
                        {/* Event Image Banner */}
                        <div className="relative h-36 w-full bg-purple-950 overflow-hidden">
                          {ev.banner_url ? (
                            <Image
                              src={ev.banner_url}
                              alt={ev.title}
                              fill
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-400">
                              <Calendar className="w-10 h-10 opacity-30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#200839] via-transparent to-transparent" />

                          {/* Highlight badge toggle */}
                          <button
                            onClick={() => toggleEventHighlight(ev)}
                            className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition cursor-pointer flex items-center gap-1 ${
                              ev.is_highlight
                                ? 'bg-amber-400 text-slate-950 shadow-md'
                                : 'bg-black/60 text-white/70 hover:text-white'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${ev.is_highlight ? 'fill-slate-950' : ''}`} />
                            <span>{ev.is_highlight ? 'Destaque' : 'Normal'}</span>
                          </button>
                        </div>

                        {/* Event Content */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                            {ev.title}
                          </h3>

                          <div className="space-y-1 text-xs text-purple-300/80">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>{new Date(ev.start_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="truncate">{ev.location_name || 'Umuarama'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="px-4 py-3 bg-purple-950/40 border-t border-purple-900/30 flex items-center justify-between">
                        <span className="text-[11px] text-purple-400 font-semibold">
                          {ev.is_free ? 'Entrada Franca' : 'Pago'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEventModal({ open: true, event: { ...ev } })}
                            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                            title="Editar Evento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: 'event',
                                id: ev.id,
                                name: ev.title,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                            title="Excluir Evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. TAB: EMPRESAS */}
          {/* ======================================================== */}
          {activeTab === 'businesses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-purple-400" />
                    <span>Gerenciar Empresas</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Cadastre estabelecimentos, gerencie destaques e selo de verificação.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setBusinessModal({
                      open: true,
                      business: {
                        name: '',
                        description: 'Comércio e Serviços',
                        address: 'Av. Paraná, Umuarama',
                        rating: 5.0,
                        is_featured: false,
                        is_verified: true,
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Empresa</span>
                </button>
              </div>

              {/* Businesses List */}
              {businesses.length === 0 ? (
                <div className="text-center py-16 text-purple-300/60 text-sm">
                  Nenhuma empresa cadastrada. Clique em &ldquo;Nova Empresa&rdquo; acima.
                </div>
              ) : (
                <div className="divide-y divide-purple-900/30 border border-purple-900/40 rounded-2xl overflow-hidden bg-[#200839]">
                  {businesses.map((bus) => (
                    <div
                      key={bus.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-950/30 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center font-bold text-purple-200 text-lg shrink-0">
                          {bus.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white text-sm sm:text-base truncate">
                              {bus.name}
                            </h3>
                            {bus.is_verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-sky-950 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded-full font-bold">
                                <ShieldCheck className="w-3 h-3 text-sky-400" />
                                Verificada
                              </span>
                            )}
                            {bus.is_featured && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                Destaque
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-purple-300/80 truncate mt-0.5">
                            {bus.description || 'Comércio Local'} • {bus.address || 'Umuarama - PR'}
                          </p>
                        </div>
                      </div>

                      {/* Toggles & Actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* Rating */}
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-black/30 px-2.5 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{bus.rating || '5.0'}</span>
                        </div>

                        {/* Criar Acesso / Usuário do Comerciante */}
                        <button
                          type="button"
                          onClick={() => handleOpenUserAccessModal(bus)}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                            bus.access_email || bus.access_password
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/80 hover:text-white'
                              : 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/80 hover:text-white'
                          }`}
                          title="Gerenciar login e senha do comerciante no Portal do Parceiro"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bus.access_email || bus.access_password ? 'Acesso Criado' : 'Criar Acesso / Usuário'}</span>
                        </button>

                        {/* Quick Toggles */}
                        <button
                          onClick={() => toggleBusinessProperty(bus, 'is_featured')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                            bus.is_featured
                              ? 'bg-purple-700 text-white border-purple-500'
                              : 'bg-purple-950/60 text-purple-400 border-purple-800/50 hover:text-white'
                          }`}
                        >
                          Destaque
                        </button>

                        <button
                          onClick={() => toggleBusinessProperty(bus, 'is_verified')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                            bus.is_verified
                              ? 'bg-sky-700 text-white border-sky-500'
                              : 'bg-purple-950/60 text-purple-400 border-purple-800/50 hover:text-white'
                          }`}
                        >
                          Verificar
                        </button>

                        {/* Edit / Delete */}
                        <div className="flex items-center gap-1.5 ml-2 border-l border-purple-800/40 pl-3">
                          <button
                            onClick={() => setBusinessModal({ open: true, business: { ...bus } })}
                            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: 'business',
                                id: bus.id,
                                name: bus.name,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. TAB: ATALHOS RÁPIDOS */}
          {/* ======================================================== */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-purple-400" />
                    <span>Atalhos Rápidos da Cidade</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Ajuste os botões de utilidade pública (Telefones úteis, Pontos turísticos, etc.).
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShortcutModal({
                      open: true,
                      shortcut: {
                        title: '',
                        subtitle: '',
                        icon: 'PhoneCall',
                        link_url: '#',
                        order_index: shortcuts.length + 1,
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Atalho</span>
                </button>
              </div>

              {/* Shortcuts List */}
              {shortcuts.length === 0 ? (
                <div className="text-center py-16 text-purple-300/60 text-sm">
                  Nenhum atalho cadastrado. Clique em &ldquo;Novo Atalho&rdquo; acima.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      className="bg-[#200839] border border-purple-900/40 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-purple-600/60 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40 flex items-center justify-center font-bold text-xs">
                          #{sc.order_index}
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-sm">
                            {sc.title}
                          </h3>
                          <p className="text-xs text-purple-300/70">
                            {sc.subtitle} • <span className="font-mono text-[11px] text-purple-400">{sc.link_url}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-purple-950 text-purple-300 px-2.5 py-1 rounded-md font-mono border border-purple-800/40">
                          {sc.icon}
                        </span>

                        <button
                          onClick={() => setShortcutModal({ open: true, shortcut: { ...sc } })}
                          className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              type: 'shortcut',
                              id: sc.id,
                              name: sc.title,
                            })
                          }
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. TAB: GERAL DA CIDADE */}
          {/* ======================================================== */}
          {activeTab === 'city' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-purple-900/40 pb-5">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Landmark className="w-6 h-6 text-purple-400" />
                  <span>Configurações Gerais da Cidade</span>
                </h2>
                <p className="text-xs text-purple-300/70 mt-1">
                  Altere o nome, slogan e imagem de fundo principal da cidade no portal.
                </p>
              </div>

              <form onSubmit={handleSaveCity} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1.5">
                      Nome da Cidade
                    </label>
                    <input
                      type="text"
                      value={city.name}
                      onChange={(e) => setCity({ ...city, name: e.target.value })}
                      required
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1.5">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={city.state || 'PR'}
                      onChange={(e) => setCity({ ...city, state: e.target.value })}
                      required
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Slogan / Título Principal (Hero)
                  </label>
                  <input
                    type="text"
                    value={city.headline || ''}
                    onChange={(e) => setCity({ ...city, headline: e.target.value })}
                    placeholder="Tudo o que acontece na sua cidade."
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    URL da Imagem de Capa do Hero
                  </label>
                  <input
                    type="text"
                    value={city.hero_image || ''}
                    onChange={(e) => setCity({ ...city, hero_image: e.target.value })}
                    placeholder="/assets/hero-new-full.jpg ou URL externa (https://...)"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-[11px] text-purple-400/80 mt-1">
                    Você pode usar imagens locais (ex: <code>/assets/hero-new-full.jpg</code>) ou links públicos do Unsplash ou Supabase Storage.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. TAB: COBERTURA DE FOTOS */}
          {/* ======================================================== */}
          {activeTab === 'albums' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Camera className="w-6 h-6 text-purple-400" />
                    <span>Gerenciar Coberturas de Fotos</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Cadastre álbuns de eventos e gerencie as fotos da galeria oficial do Venoapp.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setAlbumModal({
                      open: true,
                      album: {
                        title: '',
                        event_date: new Date().toISOString().slice(0, 10),
                        photographer_name: 'Venoapp Fotos',
                        cover_image_url:
                          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
                        event_id: null,
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Cobertura</span>
                </button>
              </div>

              {/* Albums List */}
              {albums.length === 0 ? (
                <div className="text-center py-16 text-purple-300/60 text-sm space-y-2">
                  <p>Nenhuma cobertura fotográfica cadastrada.</p>
                  <p className="text-xs text-purple-400/80">Clique em &ldquo;Nova Cobertura&rdquo; acima para criar a primeira.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {albums.map((alb) => {
                    const linkedEvent = events.find((e) => e.id === alb.event_id);
                    const albDate = new Date(alb.event_date);
                    const formattedDate = !isNaN(albDate.getTime())
                      ? albDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Data recente';

                    return (
                      <div
                        key={alb.id}
                        className="bg-[#200839] border border-purple-900/40 hover:border-purple-700/60 rounded-2xl p-4 flex flex-col justify-between gap-4 transition shadow-md"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-purple-950 shrink-0 border border-purple-800/40">
                            <Image
                              src={
                                alb.cover_image_url ||
                                'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600'
                              }
                              alt={alb.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded font-bold">
                              {alb.photo_count || 0} fotos
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">
                              {alb.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-300/80 pt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-purple-400" />
                                {formattedDate}
                              </span>
                              <span className="truncate">
                                Fotógrafo: <strong>{alb.photographer_name || 'Venoapp'}</strong>
                              </span>
                            </div>

                            {linkedEvent && (
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1 text-[11px] bg-purple-900/60 text-purple-200 border border-purple-800/40 px-2 py-0.5 rounded-md truncate max-w-full">
                                  Evento: {linkedEvent.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-purple-900/30 gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPhotosManager(alb)}
                              className="flex items-center gap-1.5 bg-purple-800/80 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer border border-purple-600/40"
                              title="Adicionar ou remover fotos deste álbum"
                            >
                              <Images className="w-3.5 h-3.5" />
                              <span>Fotos ({alb.photo_count || 0})</span>
                            </button>

                            <Link
                              href={`/fotos/${alb.id}`}
                              target="_blank"
                              className="flex items-center gap-1 text-purple-300 hover:text-white text-xs px-2.5 py-1.5 rounded-xl hover:bg-purple-900/40 transition"
                              title="Ver página pública"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ver no site</span>
                            </Link>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setAlbumModal({ open: true, album: { ...alb } })}
                              className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                              title="Editar Álbum"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: 'album',
                                  id: alb.id,
                                  name: alb.title,
                                })
                              }
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                              title="Excluir Álbum"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: BANNERS & PUBLICIDADE */}
          {/* ======================================================== */}
          {activeTab === 'banners' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1b0730] border border-purple-800/40 p-5 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-black text-white">Banners & Publicidade</h2>
                  </div>
                  <p className="text-xs text-purple-300/80 mt-1 max-w-xl">
                    Edite os banners da coluna direita (App e Institucional), gerencie os anúncios patrocinados de parceiros e personalize o banner principal do topo (Hero).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveBanners()}
                  disabled={bannersSaving}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-950/50 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{bannersSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>

              {/* CARD 1: BANNER SUPERIOR DA DIREITA (APP PROMO) */}
              <div className="bg-[#1b0730] border border-[#301254] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Banner Superior da Direita (App Mobile)</h3>
                      <p className="text-xs text-purple-300/70">Card promocional de topo na barra lateral direita</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-purple-950/60 border border-purple-800/40 px-3 py-1.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={banners.sidebar_top?.is_active !== false}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          sidebar_top: { ...banners.sidebar_top, is_active: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-purple-200">
                      {banners.sidebar_top?.is_active !== false ? 'Ativo no Portal' : 'Oculto'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Título do Banner *</label>
                      <input
                        type="text"
                        value={banners.sidebar_top?.title || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            sidebar_top: { ...banners.sidebar_top, title: e.target.value },
                          })
                        }
                        placeholder="Ex: Baixe o App Oficial"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Subtítulo / Descrição *</label>
                      <textarea
                        rows={2}
                        value={banners.sidebar_top?.subtitle || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            sidebar_top: { ...banners.sidebar_top, subtitle: e.target.value },
                          })
                        }
                        placeholder="Ex: Tenha a cidade de Umuarama inteira no seu bolso com cupons exclusivos..."
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-purple-200 mb-1">Texto do Botão</label>
                        <input
                          type="text"
                          value={banners.sidebar_top?.button_text || ''}
                          onChange={(e) =>
                            setBanners({
                              ...banners,
                              sidebar_top: { ...banners.sidebar_top, button_text: e.target.value },
                            })
                          }
                          placeholder="Ex: Instalar Agora"
                          className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-purple-200 mb-1">Link de Destino</label>
                        <input
                          type="text"
                          value={banners.sidebar_top?.link_url || ''}
                          onChange={(e) =>
                            setBanners({
                              ...banners,
                              sidebar_top: { ...banners.sidebar_top, link_url: e.target.value },
                            })
                          }
                          placeholder="Ex: /app ou https://app.venoapp.com"
                          className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-purple-200 mb-1">URL da Imagem / Mockup</label>
                      <input
                        type="text"
                        value={banners.sidebar_top?.image_url || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            sidebar_top: { ...banners.sidebar_top, image_url: e.target.value },
                          })
                        }
                        placeholder="Ex: /assets/phones-mockup.png"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="bg-[#120324] border border-purple-900/40 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 block">
                      Pré-visualização (Sidebar)
                    </span>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6b21a8] to-[#3b0764] p-5 text-white shadow-xl">
                      <div className="relative z-10 max-w-[65%] space-y-2">
                        <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                          App Oficial
                        </span>
                        <h4 className="text-base font-black leading-tight">
                          {banners.sidebar_top?.title || 'Baixe o App Oficial'}
                        </h4>
                        <p className="text-[11px] text-purple-200 leading-snug line-clamp-3">
                          {banners.sidebar_top?.subtitle || 'Tenha a cidade de Umuarama inteira no seu bolso.'}
                        </p>
                        <div className="pt-2">
                          <span className="inline-block bg-white text-purple-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md">
                            {banners.sidebar_top?.button_text || 'Instalar Agora'}
                          </span>
                        </div>
                      </div>
                      {banners.sidebar_top?.image_url && (
                        <div className="absolute -right-3 -bottom-4 w-28 h-36">
                          <Image
                            src={banners.sidebar_top.image_url}
                            alt="Mockup"
                            fill
                            sizes="120px"
                            className="object-contain object-bottom drop-shadow-2xl"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: BANNER INFERIOR DA DIREITA (INSTITUCIONAL / AMOR PELA CIDADE) */}
              <div className="bg-[#1b0730] border border-[#301254] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                      <Heart className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Banner Inferior da Direita (Institucional)</h3>
                      <p className="text-xs text-purple-300/70">Card de rodapé da sidebar celebrando a cidade</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-purple-950/60 border border-purple-800/40 px-3 py-1.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={banners.sidebar_bottom?.is_active !== false}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          sidebar_bottom: { ...banners.sidebar_bottom, is_active: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-purple-200">
                      {banners.sidebar_bottom?.is_active !== false ? 'Ativo no Portal' : 'Oculto'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Título do Banner *</label>
                      <input
                        type="text"
                        value={banners.sidebar_bottom?.title || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            sidebar_bottom: { ...banners.sidebar_bottom, title: e.target.value },
                          })
                        }
                        placeholder="Ex: Eu ❤️ Umuarama"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Subtítulo / Descrição *</label>
                      <textarea
                        rows={2}
                        value={banners.sidebar_bottom?.subtitle || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            sidebar_bottom: { ...banners.sidebar_bottom, subtitle: e.target.value },
                          })
                        }
                        placeholder="Ex: Guia oficial e agenda cultural de eventos..."
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-purple-200 mb-1">Link de Destino</label>
                        <input
                          type="text"
                          value={banners.sidebar_bottom?.link_url || ''}
                          onChange={(e) =>
                            setBanners({
                              ...banners,
                              sidebar_bottom: { ...banners.sidebar_bottom, link_url: e.target.value },
                            })
                          }
                          placeholder="Ex: /sobre ou /portal-parceiro"
                          className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-purple-200 mb-1">URL da Foto de Fundo</label>
                        <input
                          type="text"
                          value={banners.sidebar_bottom?.image_url || ''}
                          onChange={(e) =>
                            setBanners({
                              ...banners,
                              sidebar_bottom: { ...banners.sidebar_bottom, image_url: e.target.value },
                            })
                          }
                          placeholder="Ex: https://images.unsplash.com/..."
                          className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="bg-[#120324] border border-purple-900/40 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 block">
                      Pré-visualização (Sidebar)
                    </span>
                    <div className="relative overflow-hidden rounded-2xl min-h-[130px] flex items-center justify-center p-6 text-center border border-purple-800/40 shadow-xl">
                      {banners.sidebar_bottom?.image_url && (
                        <Image
                          src={banners.sidebar_bottom.image_url}
                          alt="Fundo"
                          fill
                          sizes="350px"
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-purple-950/70 to-black/60" />
                      <div className="relative z-10 space-y-1 text-white">
                        <h4 className="text-lg font-black text-white drop-shadow-md">
                          {banners.sidebar_bottom?.title || 'Eu ❤️ Umuarama'}
                        </h4>
                        <p className="text-xs text-purple-200 leading-snug drop-shadow-sm max-w-xs mx-auto">
                          {banners.sidebar_bottom?.subtitle || 'Guia oficial e agenda cultural de eventos da cidade.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: BANNERS DE ANUNCIANTES / PATROCINADORES (SIDEBAR ADS) */}
              <div className="bg-[#1b0730] border border-[#301254] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Banners de Anunciantes & Patrocinadores</h3>
                      <p className="text-xs text-purple-300/70">
                        Anúncios comerciais extras exibidos na coluna da direita com selo de patrocinado
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAdModal({
                        open: true,
                        ad: {
                          position: 'sidebar_ad',
                          title: '',
                          subtitle: '',
                          button_text: 'Conhecer',
                          link_url: '',
                          image_url:
                            'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600',
                          is_active: true,
                        },
                      })
                    }
                    className="flex items-center gap-1.5 bg-purple-800 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer border border-purple-600/40 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Anúncio Lateral</span>
                  </button>
                </div>

                {(!banners.sidebar_ads || banners.sidebar_ads.length === 0) ? (
                  <div className="text-center py-10 bg-[#120324] border border-dashed border-purple-900/50 rounded-2xl text-purple-300/70 text-xs">
                    Nenhum anúncio comercial cadastrado. Clique em &ldquo;Novo Anúncio Lateral&rdquo; para criar o primeiro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.sidebar_ads.map((ad, idx) => (
                      <div
                        key={ad.id || idx}
                        className="bg-[#140426] border border-purple-900/50 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-purple-700/60 transition"
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-purple-950 shrink-0 border border-purple-800/40">
                            {ad.image_url ? (
                              <Image
                                src={ad.image_url}
                                alt={ad.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-400">
                                <Megaphone className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                                Patrocinado
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  ad.is_active !== false
                                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {ad.is_active !== false ? 'Ativo' : 'Oculto'}
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-sm truncate">{ad.title}</h4>
                            {ad.subtitle && (
                              <p className="text-xs text-purple-300/80 line-clamp-1">{ad.subtitle}</p>
                            )}
                            <div className="text-[11px] text-purple-400 truncate pt-0.5">
                              Link: {ad.link_url || '#'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-950/80">
                          <button
                            type="button"
                            onClick={() => setAdModal({ open: true, ad: { ...ad }, index: idx })}
                            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                            title="Editar Anúncio"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAd(idx)}
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                            title="Excluir Anúncio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 4: BANNER PRINCIPAL (HERO DA HOME) */}
              <div className="bg-[#1b0730] border border-[#301254] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                      <Star className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Banner Principal do Topo (Hero da Home)</h3>
                      <p className="text-xs text-purple-300/70">
                        O grande banner de destaque que recebe todos os visitantes na página inicial
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-purple-950/60 border border-purple-800/40 px-3 py-1.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={banners.hero?.is_active !== false}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          hero: { ...banners.hero, is_active: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-purple-200">
                      {banners.hero?.is_active !== false ? 'Ativo na Home' : 'Oculto'}
                    </span>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Tagline / Selo do Topo</label>
                      <input
                        type="text"
                        value={banners.hero?.tagline || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            hero: {
                              ...banners.hero,
                              tagline: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: O Portal de Umuarama"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Frase Decorativa no Rodapé do Banner</label>
                      <input
                        type="text"
                        value={banners.hero?.decorative_text || ''}
                        onChange={(e) =>
                          setBanners({
                            ...banners,
                            hero: {
                              ...banners.hero,
                              decorative_text: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Umuarama conectada em um só lugar"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Título Principal do Hero *</label>
                    <input
                      type="text"
                      value={banners.hero?.title || ''}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          hero: { ...banners.hero, title: e.target.value },
                        })
                      }
                      placeholder="Ex: Tudo o que acontece na sua cidade"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Subtítulo Explicativo</label>
                    <textarea
                      rows={2}
                      value={banners.hero?.subtitle || ''}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          hero: { ...banners.hero, subtitle: e.target.value },
                        })
                      }
                      placeholder="Ex: Descubra eventos imperdíveis, os melhores comércios, coberturas fotográficas exclusivas e atalhos úteis de Umuarama."
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">URL da Foto de Fundo do Hero</label>
                    <input
                      type="text"
                      value={banners.hero?.image_url || ''}
                      onChange={(e) =>
                        setBanners({
                          ...banners,
                          hero: { ...banners.hero, image_url: e.target.value },
                        })
                      }
                      placeholder="Ex: /assets/hero-new-full.jpg ou https://images.unsplash.com/..."
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 5: DICA DE ARMAZENAMENTO E SQL */}
              <div className="bg-[#140426] border border-purple-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-sm text-purple-200">Armazenamento Híbrido Resiliente</h4>
                </div>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  Os banners são salvos instantaneamente no arquivo de configuração do portal e sincronizados automaticamente na nuvem Supabase quando a tabela <code className="bg-black/40 px-1.5 py-0.5 rounded text-purple-200">city_banners</code> estiver disponível. Para criar a tabela no Supabase SQL Editor, execute:
                </p>
                <div className="bg-[#0b0214] border border-purple-950 rounded-xl p-3 text-[11px] font-mono text-purple-300 overflow-x-auto select-all">
                  CREATE TABLE IF NOT EXISTS public.city_banners (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
                    position VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    subtitle TEXT,
                    image_url TEXT,
                    link_url TEXT,
                    button_text VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    order_index INTEGER DEFAULT 0,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                  );
                </div>
              </div>

              {/* BOTTOM SAVE BAR */}
              <div className="sticky bottom-6 z-20 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveBanners()}
                  disabled={bannersSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm px-7 py-3 rounded-2xl shadow-2xl shadow-purple-950 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{bannersSaving ? 'Salvando Alterações...' : 'Salvar Todos os Banners & Publicidade'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: CUPONS & OFERTAS */}
          {/* ======================================================== */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-pink-400" />
                    <span>Cupons & Ofertas ({city.name})</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Gerencie os cupons de desconto ativos para os comércios locais desta cidade.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOfferModal({
                      open: true,
                      offer: {
                        business_id: businesses[0]?.id || '',
                        discount_percentage: 15,
                        valid_until: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
                      },
                    })
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cupom</span>
                </button>
              </div>

              {offers.length === 0 ? (
                <div className="bg-[#1b0730] border border-purple-900/40 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 text-purple-400 flex items-center justify-center mx-auto border border-purple-800/50">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base">Nenhum cupom ativo em {city.name}</h3>
                  <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
                    Crie ofertas promocionais exclusivas com foto, código e porcentagem de desconto para atrair clientes.
                  </p>
                  <button
                    onClick={() =>
                      setOfferModal({
                        open: true,
                        offer: {
                          business_id: businesses[0]?.id || '',
                          discount_percentage: 15,
                          valid_until: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white pt-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Primeiro Cupom
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers.map((off) => {
                    const bus = businesses.find((b) => b.id === off.business_id);
                    const validDate = new Date(off.valid_until);
                    const formattedDate = !isNaN(validDate.getTime())
                      ? validDate.toLocaleDateString('pt-BR')
                      : 'Indeterminado';

                    return (
                      <div
                        key={off.id}
                        className="bg-[#1b0730] border border-purple-800/40 hover:border-purple-600/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-md group"
                      >
                        {/* Imagem do Cupom */}
                        <div className="relative h-36 w-full overflow-hidden bg-black/40 border-b border-purple-900/40">
                          {off.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={off.image_url}
                              alt={off.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-950 flex items-center justify-center text-purple-400">
                              <Tag className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1b0730] via-transparent to-black/30" />

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="bg-purple-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-purple-400/30">
                              {off.discount_percentage}% OFF
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-3 right-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/40">
                              {bus?.name || 'Comércio Local'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                                {off.title}
                              </h3>
                              <p className="text-[11px] text-purple-300/70 mt-1">
                                Válido até: <strong className="text-white">{formattedDate}</strong>
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteOffer(off.id)}
                              title="Excluir Cupom"
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Coupon Code */}
                          <div className="pt-2.5 border-t border-purple-900/40 flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg border border-dashed border-amber-400/50 tracking-wider">
                              {off.coupon_code}
                            </span>
                            <span className="text-[10px] text-purple-400">Cupom Ativo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: PLANOS & ASSINANTES */}
          {/* ======================================================== */}
          {activeTab === 'subscriptions' && (() => {
            // Computed metrics
            const totalBusinesses = businesses.length;
            const activeSubs = businesses.filter((b) => b.subscription_status === 'active').length;
            const trialSubs = businesses.filter(
              (b) => b.subscription_status === 'trial' || b.subscription_status === 'pending' || !b.subscription_status
            ).length;

            // Monthly Revenue estimation
            const estimatedRevenue = businesses.reduce((acc, b) => {
              if (b.subscription_status !== 'active') return acc;
              const p = plans.find((pl) => pl.id === b.plan_id);
              return acc + (p ? p.price_monthly : 49.9);
            }, 0);

            // Filtered businesses
            const filteredSubs = businesses.filter((b) => {
              const matchesSearch =
                !subSearch ||
                b.name.toLowerCase().includes(subSearch.toLowerCase()) ||
                (b.category && b.category.toLowerCase().includes(subSearch.toLowerCase())) ||
                (b.whatsapp && b.whatsapp.includes(subSearch));

              const matchesPlan =
                subPlanFilter === 'all' ||
                b.plan_id === subPlanFilter ||
                (!b.plan_id && subPlanFilter === 'none');

              const status = b.subscription_status || 'trial';
              const matchesStatus =
                subStatusFilter === 'all' ||
                status === subStatusFilter;

              return matchesSearch && matchesPlan && matchesStatus;
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header with CTA to public sales page */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1b0730] border border-purple-800/40 p-5 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-xl font-black text-white">Planos & Assinantes Comerciais</h2>
                    </div>
                    <p className="text-xs text-purple-300/80 mt-1 max-w-xl">
                      Acompanhe as empresas cadastradas, gerencie planos de publicidade, status de pagamento e faturamento da franquia.
                    </p>
                  </div>
                  <Link
                    href="/anunciar"
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-purple-950/50 shrink-0"
                  >
                    <span>Ver Página de Vendas (/anunciar)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* KPIs & Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-4.5 space-y-1">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                      Total de Empresas
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white">{totalBusinesses}</div>
                    <span className="text-[11px] text-purple-300/70 block">Cadastradas no portal</span>
                  </div>

                  <div className="bg-[#1b0730] border border-emerald-800/50 rounded-2xl p-4.5 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Assinaturas Ativas
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">{activeSubs}</div>
                    <span className="text-[11px] text-emerald-300/70 block">Gerando receita mensal</span>
                  </div>

                  <div className="bg-[#1b0730] border border-amber-800/50 rounded-2xl p-4.5 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Trial / Pendentes
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">{trialSubs}</div>
                    <span className="text-[11px] text-amber-300/70 block">Aguardando ativação</span>
                  </div>

                  <div className="bg-gradient-to-br from-[#290849] to-[#18042c] border border-purple-700/60 rounded-2xl p-4.5 space-y-1 shadow-lg">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Faturamento Mensal
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold block">Receita Recorrente (MRR)</span>
                  </div>
                </div>

                {/* Plan Distribution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((p) => {
                    const countInPlan = businesses.filter((b) => b.plan_id === p.id).length;
                    return (
                      <div
                        key={p.id}
                        className={`bg-[#140426] border rounded-2xl p-4 flex items-center justify-between gap-4 ${
                          p.is_popular
                            ? 'border-purple-600/70 shadow-md shadow-purple-950/40'
                            : 'border-purple-900/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{p.name}</h4>
                            {p.is_popular && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold uppercase">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-purple-300/70">
                            R$ {p.price_monthly.toFixed(2).replace('.', ',')} / mês
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-white">{countInPlan}</span>
                          <span className="text-[10px] text-purple-300/70 block">empresas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Filters & Search */}
                <div className="bg-[#1b0730] border border-[#301254] rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar empresa ou WhatsApp..."
                        value={subSearch}
                        onChange={(e) => setSubSearch(e.target.value)}
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                      />
                      <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                    </div>

                    <div>
                      <select
                        value={subPlanFilter}
                        onChange={(e) => setSubPlanFilter(e.target.value)}
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="all">Todos os Planos</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (R$ {p.price_monthly.toFixed(2).replace('.', ',')})
                          </option>
                        ))}
                        <option value="none">Sem Plano Definido</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={subStatusFilter}
                        onChange={(e) => setSubStatusFilter(e.target.value)}
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativo (Pago)</option>
                        <option value="trial">Período de Teste (Trial)</option>
                        <option value="pending">Aguardando Pagamento</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-[#1b0730] border border-[#301254] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-purple-900/40 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">
                      Lista de Empresas Assinantes ({filteredSubs.length})
                    </h3>
                  </div>

                  {filteredSubs.length === 0 ? (
                    <div className="p-10 text-center text-xs text-purple-300/70">
                      Nenhuma empresa encontrada com os filtros selecionados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#140426] text-purple-300 uppercase tracking-wider text-[10px] border-b border-purple-900/40">
                          <tr>
                            <th className="p-3.5">Empresa</th>
                            <th className="p-3.5">Contato / WhatsApp</th>
                            <th className="p-3.5">Plano Contratado</th>
                            <th className="p-3.5">Status da Assinatura</th>
                            <th className="p-3.5 text-right">Ações Comerciais</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-900/30 text-purple-100">
                          {filteredSubs.map((bus) => {
                            const currentPlan = plans.find((p) => p.id === bus.plan_id);
                            const status = bus.subscription_status || 'trial';

                            return (
                              <tr key={bus.id} className="hover:bg-purple-950/30 transition">
                                <td className="p-3.5">
                                  <div className="font-bold text-white text-sm">{bus.name}</div>
                                  <div className="text-[11px] text-purple-300/70 flex items-center gap-1.5 mt-0.5">
                                    <span>{bus.category || 'Comércio'}</span>
                                    {bus.is_verified && (
                                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-1 rounded font-bold">
                                        VERIFICADO
                                      </span>
                                    )}
                                    {bus.is_featured && (
                                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/40 px-1 rounded font-bold">
                                        DESTAQUE
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  {bus.whatsapp ? (
                                    <a
                                      href={`https://wa.me/55${bus.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        `Olá! Falamos da franquia Venoapp sobre o plano da empresa ${bus.name}.`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/30 transition"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{bus.whatsapp}</span>
                                    </a>
                                  ) : (
                                    <span className="text-purple-400/50">Não informado</span>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  <select
                                    value={bus.plan_id || ''}
                                    onChange={(e) => handleUpdateSubscriptionPlan(bus.id, e.target.value)}
                                    className="bg-[#200839] border border-purple-800/50 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-purple-400 cursor-pointer"
                                  >
                                    <option value="">Sem Plano</option>
                                    {plans.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} - R$ {p.price_monthly.toFixed(2).replace('.', ',')}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="p-3.5">
                                  <select
                                    value={status}
                                    onChange={(e) => handleUpdateSubscriptionStatus(bus.id, e.target.value)}
                                    className={`border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer ${
                                      status === 'active'
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                        : status === 'trial'
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                        : status === 'pending'
                                        ? 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                    }`}
                                  >
                                    <option value="active">🟢 Ativo (Pago)</option>
                                    <option value="trial">🟡 Teste Grátis (Trial)</option>
                                    <option value="pending">🟠 Aguardando Pagamento</option>
                                    <option value="canceled">🔴 Cancelado</option>
                                  </select>
                                </td>

                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {bus.whatsapp && (
                                      <a
                                        href={`https://wa.me/55${bus.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                          `Olá! Notamos seu cadastro no plano ${
                                            currentPlan ? currentPlan.name : 'Venoapp'
                                          }. Segue a confirmação da sua ativação comercial no portal!`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Enviar Mensagem Comercial"
                                        className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 transition cursor-pointer"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    <Link
                                      href="/portal-parceiro"
                                      onClick={() => {
                                        localStorage.setItem('venoapp_partner_business_id', bus.id);
                                        localStorage.setItem('venoapp_partner_business_name', bus.name);
                                      }}
                                      title="Abrir no Portal do Parceiro"
                                      className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
                                    >
                                      <Store className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB: FRANQUIAS & CIDADES (MASTER FRANQUEADORA) */}
          {/* ======================================================== */}
          {activeTab === 'franchises' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1b0730] border border-purple-800/40 p-5 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-black text-white">Rede de Franquias & Cidades</h2>
                  </div>
                  <p className="text-xs text-purple-300/80 mt-1 max-w-xl">
                    Visão Master da Franqueadora: gerencie todas as cidades da rede Venoapp, cadastre novas praças e monitore os franqueados locais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFranchiseModal({
                      open: true,
                      city: {
                        name: '',
                        state: 'PR',
                        slug: '',
                        headline: '',
                        hero_image: '',
                        franchisee_name: '',
                        franchisee_email: '',
                        franchisee_phone: '',
                        status: 'active',
                      },
                      submitting: false,
                    })
                  }
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-950/40 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Franquia / Cidade</span>
                </button>
              </div>

              {/* Master KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-4.5 space-y-1">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    Cidades na Rede
                  </span>
                  <div className="text-3xl font-black text-white">{availableCities.length}</div>
                  <span className="text-[11px] text-purple-300/70 block">Praças cadastradas</span>
                </div>

                <div className="bg-[#1b0730] border border-emerald-800/50 rounded-2xl p-4.5 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Franquias Ativas
                  </span>
                  <div className="text-3xl font-black text-emerald-400">
                    {availableCities.filter((c) => c.status !== 'inactive').length}
                  </div>
                  <span className="text-[11px] text-emerald-300/70 block">Em operação comercial</span>
                </div>

                <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-4.5 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Praça em Administração Atual
                  </span>
                  <div className="text-xl font-black text-white truncate">
                    {city.name} - {city.state || 'PR'}
                  </div>
                  <span className="text-[11px] text-purple-300/70 block">Slug: /{city.slug}</span>
                </div>
              </div>

              {/* Cities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableCities.map((c) => {
                  const isCurrent = c.id === selectedCityId;

                  return (
                    <div
                      key={c.id || c.slug}
                      className={`relative bg-[#170529] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-purple-500 shadow-xl shadow-purple-950/60 ring-2 ring-purple-500/50'
                          : 'border-purple-900/50 hover:border-purple-700/60'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-32 w-full bg-purple-950 overflow-hidden">
                        {c.hero_image && (
                          <Image
                            src={c.hero_image}
                            alt={c.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#170529] via-black/40 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              c.status !== 'inactive'
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {c.status !== 'inactive' ? 'Ativa' : 'Implantação'}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3.5 text-white">
                          <h3 className="text-lg font-black leading-tight drop-shadow-md">
                            {c.name} - {c.state || 'PR'}
                          </h3>
                          <span className="text-[11px] text-purple-200 font-mono">
                            /{c.slug}
                          </span>
                        </div>
                      </div>

                      {/* City & Franchisee Details */}
                      <div className="p-4 space-y-3 flex-1 text-xs">
                        {c.headline && (
                          <p className="text-purple-300/80 text-[11px] line-clamp-2">
                            {c.headline}
                          </p>
                        )}

                        <div className="space-y-1.5 pt-1 border-t border-purple-900/40 text-purple-200/90">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-purple-400 font-semibold">Franqueado:</span>
                            <span className="font-bold text-white truncate max-w-[150px]">
                              {c.franchisee_name || 'Matriz Venoapp'}
                            </span>
                          </div>

                          {c.franchisee_phone && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-purple-400 font-semibold">WhatsApp:</span>
                              <a
                                href={`https://wa.me/55${c.franchisee_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Olá Franqueado de ${c.name}! Contato da franqueadora Venoapp.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{c.franchisee_phone}</span>
                              </a>
                            </div>
                          )}

                          {c.franchisee_email && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-purple-400 font-semibold flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>E-mail:</span>
                              </span>
                              <span className="text-purple-300 truncate max-w-[150px]">
                                {c.franchisee_email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-3 bg-[#110320] border-t border-purple-950 flex items-center gap-2">
                        {isCurrent ? (
                          <span className="flex-1 text-center py-2 text-xs font-bold text-purple-300 bg-purple-900/40 rounded-xl border border-purple-700/40">
                            ✓ Praça Selecionada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              handleChangeCity(c.id);
                              setActiveTab('businesses');
                            }}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white transition cursor-pointer text-center shadow-sm"
                          >
                            Administrar Praça
                          </button>
                        )}

                        <Link
                          href={`/${c.slug}`}
                          target="_blank"
                          title="Ver portal desta cidade"
                          className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white transition cursor-pointer border border-purple-800/40"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: EVENT FORM */}
      {/* ======================================================== */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white">
                {eventModal.event?.id ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button
                onClick={() => setEventModal({ open: false, event: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Título do Evento *</label>
                <input
                  type="text"
                  required
                  value={eventModal.event?.title || ''}
                  onChange={(e) =>
                    setEventModal({ ...eventModal, event: { ...eventModal.event, title: e.target.value } })
                  }
                  placeholder="Ex: Show Nacional em Umuarama"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Data e Hora *</label>
                  <input
                    type="datetime-local"
                    required
                    value={
                      eventModal.event?.start_date
                        ? new Date(eventModal.event.start_date).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        event: { ...eventModal.event, start_date: new Date(e.target.value).toISOString() },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Local</label>
                  <input
                    type="text"
                    value={eventModal.event?.location_name || ''}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        event: { ...eventModal.event, location_name: e.target.value },
                      })
                    }
                    placeholder="Ex: Parque de Exposições"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">URL da Imagem / Banner</label>
                <input
                  type="text"
                  value={eventModal.event?.banner_url || ''}
                  onChange={(e) =>
                    setEventModal({
                      ...eventModal,
                      event: { ...eventModal.event, banner_url: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/... ou /assets/event-luan.jpg"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(eventModal.event?.is_highlight)}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        event: { ...eventModal.event, is_highlight: e.target.checked },
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-purple-950 border-purple-800"
                  />
                  <span className="font-bold text-purple-200">Destacar no Portal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(eventModal.event?.is_free)}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        event: { ...eventModal.event, is_free: e.target.checked },
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-purple-950 border-purple-800"
                  />
                  <span className="font-bold text-purple-200">Entrada Gratuita</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setEventModal({ open: false, event: null })}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BUSINESS FORM */}
      {/* ======================================================== */}
      {businessModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white">
                {businessModal.business?.id ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <button
                onClick={() => setBusinessModal({ open: false, business: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  value={businessModal.business?.name || ''}
                  onChange={(e) =>
                    setBusinessModal({
                      ...businessModal,
                      business: { ...businessModal.business, name: e.target.value },
                    })
                  }
                  placeholder="Ex: Pizzaria Sabor & Arte"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Categoria / Descrição Curta</label>
                <input
                  type="text"
                  value={businessModal.business?.description || ''}
                  onChange={(e) =>
                    setBusinessModal({
                      ...businessModal,
                      business: { ...businessModal.business, description: e.target.value },
                    })
                  }
                  placeholder="Ex: Restaurante e Pizzaria artesanal"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={businessModal.business?.address || ''}
                    onChange={(e) =>
                      setBusinessModal({
                        ...businessModal,
                        business: { ...businessModal.business, address: e.target.value },
                      })
                    }
                    placeholder="Ex: Av. Paraná, 1200"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Avaliação (1.0 a 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={businessModal.business?.rating || 5.0}
                    onChange={(e) =>
                      setBusinessModal({
                        ...businessModal,
                        business: { ...businessModal.business, rating: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Contatos Digitais (WhatsApp, Instagram, Website) */}
              <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-800/40 space-y-2.5">
                <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Canais de Contato & Redes</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-medium text-purple-200 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" /> WhatsApp
                    </label>
                    <input
                      type="text"
                      value={businessModal.business?.whatsapp || ''}
                      onChange={(e) =>
                        setBusinessModal({
                          ...businessModal,
                          business: { ...businessModal.business, whatsapp: e.target.value },
                        })
                      }
                      placeholder="(44) 99999-9999"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-purple-200 mb-1 flex items-center gap-1">
                      <InstagramIcon className="w-3 h-3 text-pink-400" /> Instagram
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-purple-400 font-bold text-xs select-none">@</span>
                      <input
                        type="text"
                        value={(businessModal.business?.instagram || '').replace(/^@/, '')}
                        onChange={(e) =>
                          setBusinessModal({
                            ...businessModal,
                            business: { ...businessModal.business, instagram: e.target.value.replace(/^@/, '') },
                          })
                        }
                        placeholder="perfil"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl pl-7 pr-2 py-1.5 text-white focus:outline-none focus:border-purple-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-purple-200 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-400" /> Site Oficial
                    </label>
                    <input
                      type="text"
                      value={businessModal.business?.website || ''}
                      onChange={(e) =>
                        setBusinessModal({
                          ...businessModal,
                          business: { ...businessModal.business, website: e.target.value },
                        })
                      }
                      placeholder="https://meusite.com.br"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-400 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Upload de Foto do Computador + URL */}
              <div>
                <label className="block font-bold text-purple-200 mb-1">Foto de Capa / Fachada da Empresa</label>
                
                {/* Input escondido para upload local */}
                <input
                  type="file"
                  ref={businessFileInputRef}
                  onChange={handleBusinessFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-purple-950/30 rounded-2xl border border-dashed border-purple-700/50 hover:border-purple-500 transition mb-2">
                  {businessModal.business?.cover_url ? (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-purple-700 shrink-0 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={businessModal.business.cover_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center shrink-0 text-purple-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <button
                      type="button"
                      disabled={uploadingBusinessPhoto}
                      onClick={() => businessFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingBusinessPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Escolher foto do computador</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-purple-300/70 mt-1">
                      Suporta JPG, PNG, WEBP direto do computador
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={businessModal.business?.cover_url || ''}
                    onChange={(e) =>
                      setBusinessModal({
                        ...businessModal,
                        business: { ...businessModal.business, cover_url: e.target.value },
                      })
                    }
                    placeholder="Ou cole a URL direta: https://... ou /assets/empresa-bella.jpg"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-purple-400/40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(businessModal.business?.is_featured)}
                    onChange={(e) =>
                      setBusinessModal({
                        ...businessModal,
                        business: { ...businessModal.business, is_featured: e.target.checked },
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-purple-950 border-purple-800"
                  />
                  <span className="font-bold text-purple-200">Destacar no Portal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(businessModal.business?.is_verified)}
                    onChange={(e) =>
                      setBusinessModal({
                        ...businessModal,
                        business: { ...businessModal.business, is_verified: e.target.checked },
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-purple-950 border-purple-800"
                  />
                  <span className="font-bold text-purple-200">Empresa Verificada</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setBusinessModal({ open: false, business: null })}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OFFER FORM */}
      {/* ======================================================== */}
      {offerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-400" />
                <span>Novo Cupom Promocional</span>
              </h3>
              <button
                onClick={() => setOfferModal({ open: false, offer: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Empresa Anunciante *</label>
                <select
                  required
                  value={offerModal.offer?.business_id || ''}
                  onChange={(e) =>
                    setOfferModal({
                      ...offerModal,
                      offer: { ...offerModal.offer, business_id: e.target.value },
                    })
                  }
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="" disabled>Selecione a empresa...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Título da Oferta *</label>
                <input
                  type="text"
                  required
                  value={offerModal.offer?.title || ''}
                  onChange={(e) =>
                    setOfferModal({
                      ...offerModal,
                      offer: { ...offerModal.offer, title: e.target.value },
                    })
                  }
                  placeholder="Ex: 20% OFF na primeira compra"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Desconto (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={offerModal.offer?.discount_percentage || 15}
                    onChange={(e) =>
                      setOfferModal({
                        ...offerModal,
                        offer: { ...offerModal.offer, discount_percentage: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Código do Cupom *</label>
                  <input
                    type="text"
                    required
                    value={offerModal.offer?.coupon_code || ''}
                    onChange={(e) =>
                      setOfferModal({
                        ...offerModal,
                        offer: { ...offerModal.offer, coupon_code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="Ex: PROMO20"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Data de Validade *</label>
                <input
                  type="date"
                  required
                  value={offerModal.offer?.valid_until ? offerModal.offer.valid_until.slice(0, 10) : ''}
                  onChange={(e) =>
                    setOfferModal({
                      ...offerModal,
                      offer: { ...offerModal.offer, valid_until: e.target.value },
                    })
                  }
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Upload de Foto do Cupom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-purple-200">Foto / Arte Promocional (Opcional)</label>
                  {offerModal.offer?.image_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setOfferModal({
                          ...offerModal,
                          offer: { ...offerModal.offer, image_url: '' },
                        })
                      }
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={offerFileInputRef}
                  onChange={handleOfferFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-purple-950/30 rounded-2xl border border-dashed border-purple-700/50 hover:border-purple-500 transition mb-2">
                  {offerModal.offer?.image_url ? (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-purple-700 shrink-0 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={offerModal.offer.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center shrink-0 text-purple-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <button
                      type="button"
                      disabled={uploadingOfferPhoto}
                      onClick={() => offerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingOfferPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Escolher foto do computador</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-purple-300/70 mt-1">
                      Envie foto do produto, prato ou banner promocional
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={offerModal.offer?.image_url || ''}
                  onChange={(e) =>
                    setOfferModal({
                      ...offerModal,
                      offer: { ...offerModal.offer, image_url: e.target.value },
                    })
                  }
                  placeholder="Ou cole a URL direta: https://... ou /assets/..."
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-purple-400/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setOfferModal({ open: false, offer: null })}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Publicar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SHORTCUT FORM */}
      {/* ======================================================== */}
      {shortcutModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white">
                {shortcutModal.shortcut?.id ? 'Editar Atalho' : 'Novo Atalho'}
              </h3>
              <button
                onClick={() => setShortcutModal({ open: false, shortcut: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShortcut} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={shortcutModal.shortcut?.title || ''}
                  onChange={(e) =>
                    setShortcutModal({
                      ...shortcutModal,
                      shortcut: { ...shortcutModal.shortcut, title: e.target.value },
                    })
                  }
                  placeholder="Ex: Telefones úteis"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={shortcutModal.shortcut?.subtitle || ''}
                  onChange={(e) =>
                    setShortcutModal({
                      ...shortcutModal,
                      shortcut: { ...shortcutModal.shortcut, subtitle: e.target.value },
                    })
                  }
                  placeholder="Ex: Serviços essenciais"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Ícone</label>
                  <select
                    value={shortcutModal.shortcut?.icon || 'PhoneCall'}
                    onChange={(e) =>
                      setShortcutModal({
                        ...shortcutModal,
                        shortcut: { ...shortcutModal.shortcut, icon: e.target.value },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="PhoneCall">Telefone (PhoneCall)</option>
                    <option value="Landmark">Turismo (Landmark)</option>
                    <option value="TreePine">Parque/Lazer (TreePine)</option>
                    <option value="Info">Informações (Info)</option>
                    <option value="Zap">Raio/Destaque (Zap)</option>
                    <option value="Heart">Coração (Heart)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Ordem (Posição)</label>
                  <input
                    type="number"
                    value={shortcutModal.shortcut?.order_index || 1}
                    onChange={(e) =>
                      setShortcutModal({
                        ...shortcutModal,
                        shortcut: { ...shortcutModal.shortcut, order_index: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Link de Destino (URL)</label>
                <input
                  type="text"
                  value={shortcutModal.shortcut?.link_url || ''}
                  onChange={(e) =>
                    setShortcutModal({
                      ...shortcutModal,
                      shortcut: { ...shortcutModal.shortcut, link_url: e.target.value },
                    })
                  }
                  placeholder="Ex: /utilitarios/telefones ou https://..."
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShortcutModal({ open: false, shortcut: null })}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Salvar Atalho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ALBUM FORM */}
      {/* ======================================================== */}
      {albumModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <span>{albumModal.album?.id ? 'Editar Cobertura' : 'Nova Cobertura de Fotos'}</span>
              </h3>
              <button
                onClick={() => setAlbumModal({ open: false, album: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Título da Cobertura *</label>
                <input
                  type="text"
                  required
                  value={albumModal.album?.title || ''}
                  onChange={(e) =>
                    setAlbumModal({
                      ...albumModal,
                      album: { ...albumModal.album, title: e.target.value },
                    })
                  }
                  placeholder="Ex: Show Henrique & Juliano - Expo Umuarama"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Data do Evento *</label>
                  <input
                    type="date"
                    required
                    value={
                      albumModal.album?.event_date
                        ? albumModal.album.event_date.slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
                    onChange={(e) =>
                      setAlbumModal({
                        ...albumModal,
                        album: { ...albumModal.album, event_date: e.target.value },
                      })
                    }
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Nome do Fotógrafo</label>
                  <input
                    type="text"
                    value={albumModal.album?.photographer_name || ''}
                    onChange={(e) =>
                      setAlbumModal({
                        ...albumModal,
                        album: { ...albumModal.album, photographer_name: e.target.value },
                      })
                    }
                    placeholder="Ex: Marcos Fotografia / Venoapp"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Evento Vinculado (Opcional)</label>
                <select
                  value={albumModal.album?.event_id || ''}
                  onChange={(e) =>
                    setAlbumModal({
                      ...albumModal,
                      album: { ...albumModal.album, event_id: e.target.value || null },
                    })
                  }
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="">Nenhum (Cobertura independente)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({new Date(ev.start_date).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-purple-400/80 mt-1">
                  Vincular a um evento ajuda os visitantes a encontrarem as fotos a partir da agenda.
                </p>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">URL da Imagem de Capa</label>
                <input
                  type="text"
                  value={albumModal.album?.cover_image_url || ''}
                  onChange={(e) =>
                    setAlbumModal({
                      ...albumModal,
                      album: { ...albumModal.album, cover_image_url: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/... ou URL da foto"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setAlbumModal({ open: false, album: null })}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Salvar Cobertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PHOTOS MANAGER (GERENCIAR FOTOS) */}
      {/* ======================================================== */}
      {photosManagerModal.open && photosManagerModal.album && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Images className="w-5 h-5 text-purple-400" />
                  <span>Gerenciar Fotos da Cobertura</span>
                </h3>
                <p className="text-xs text-purple-300/80 truncate max-w-md mt-0.5">
                  Álbum: <strong className="text-white">{photosManagerModal.album.title}</strong>
                </p>
              </div>

              <button
                onClick={() =>
                  setPhotosManagerModal({
                    open: false,
                    album: null,
                    photos: [],
                    newPhotoUrl: '',
                    newPhotoCaption: '',
                    isAdding: false,
                  })
                }
                className="p-1.5 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Photo Form */}
            <form
              onSubmit={handleAddPhoto}
              className="bg-[#200839] border border-purple-900/60 rounded-2xl p-4 space-y-3 shrink-0 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-purple-400" /> Adicionar Foto
                </span>
                <span className="text-[11px] text-purple-400">
                  Total: {photosManagerModal.photos.length} fotos cadastradas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="url"
                    required
                    placeholder="URL direta da foto (https://...)"
                    value={photosManagerModal.newPhotoUrl}
                    onChange={(e) =>
                      setPhotosManagerModal((prev) => ({ ...prev, newPhotoUrl: e.target.value }))
                    }
                    className="w-full bg-[#160627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 text-xs"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Legenda (opcional)"
                    value={photosManagerModal.newPhotoCaption}
                    onChange={(e) =>
                      setPhotosManagerModal((prev) => ({ ...prev, newPhotoCaption: e.target.value }))
                    }
                    className="w-full bg-[#160627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={photosManagerModal.isAdding}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{photosManagerModal.isAdding ? 'Adicionando...' : 'Adicionar Foto'}</span>
                </button>
              </div>
            </form>

            {/* Photos List Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {photosManagerModal.photos.length === 0 ? (
                <div className="text-center py-12 text-purple-300/60 text-xs space-y-1">
                  <p>Nenhuma foto adicionada ainda a esta cobertura.</p>
                  <p className="text-purple-400/70">Cole a URL de uma foto acima para incluí-la na galeria pública.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photosManagerModal.photos.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="group relative rounded-xl overflow-hidden bg-[#160627] border border-purple-900/40 aspect-4/3 flex flex-col justify-end"
                    >
                      <Image
                        src={photo.photo_url}
                        alt={photo.caption || `Foto ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer transition"
                          title="Remover foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        #{index + 1}
                      </div>

                      {photo.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[10px] text-purple-200 truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-900/40 shrink-0">
              <Link
                href={`/fotos/${photosManagerModal.album.id}`}
                target="_blank"
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visualizar na galeria pública</span>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setPhotosManagerModal({
                    open: false,
                    album: null,
                    photos: [],
                    newPhotoUrl: '',
                    newPhotoCaption: '',
                    isAdding: false,
                  })
                }
                className="bg-purple-900/80 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SIDEBAR AD FORM */}
      {/* ======================================================== */}
      {adModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white">
                {adModal.index !== undefined ? 'Editar Anúncio Lateral' : 'Novo Anúncio Lateral'}
              </h3>
              <button
                type="button"
                onClick={() => setAdModal({ open: false, ad: null })}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Título do Anúncio *</label>
                <input
                  type="text"
                  required
                  value={adModal.ad?.title || ''}
                  onChange={(e) =>
                    setAdModal({ ...adModal, ad: { ...adModal.ad, title: e.target.value } })
                  }
                  placeholder="Ex: Espaço Gourmet Umuarama"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Subtítulo / Descrição</label>
                <textarea
                  rows={2}
                  value={adModal.ad?.subtitle || ''}
                  onChange={(e) =>
                    setAdModal({ ...adModal, ad: { ...adModal.ad, subtitle: e.target.value } })
                  }
                  placeholder="Ex: Rodízio de pizzas e chopp em dobro toda quarta-feira!"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={adModal.ad?.button_text || 'Conhecer'}
                    onChange={(e) =>
                      setAdModal({ ...adModal, ad: { ...adModal.ad, button_text: e.target.value } })
                    }
                    placeholder="Ex: Conhecer, Ver Mais..."
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Link de Destino</label>
                  <input
                    type="text"
                    value={adModal.ad?.link_url || ''}
                    onChange={(e) =>
                      setAdModal({ ...adModal, ad: { ...adModal.ad, link_url: e.target.value } })
                    }
                    placeholder="Ex: https://wa.me/... ou /empresas/restaurante"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">URL da Imagem de Destaque</label>
                <input
                  type="text"
                  value={adModal.ad?.image_url || ''}
                  onChange={(e) =>
                    setAdModal({ ...adModal, ad: { ...adModal.ad, image_url: e.target.value } })
                  }
                  placeholder="Ex: https://images.unsplash.com/photo-..."
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adModal.ad?.is_active !== false}
                    onChange={(e) =>
                      setAdModal({ ...adModal, ad: { ...adModal.ad, is_active: e.target.checked } })
                    }
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <span className="font-semibold text-purple-200">Anúncio Ativo na Barra Lateral</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setAdModal({ open: false, ad: null })}
                  className="px-4 py-2 rounded-xl font-semibold text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md shadow-purple-900/40 cursor-pointer"
                >
                  Aplicar Anúncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVA FRANQUIA / CIDADE */}
      {/* ======================================================== */}
      {franchiseModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-amber-600/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">Cadastrar Nova Franquia / Cidade</h3>
              </div>
              <button
                type="button"
                onClick={() => setFranchiseModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFranchise} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-purple-200 mb-1">Nome da Cidade *</label>
                  <input
                    type="text"
                    required
                    value={franchiseModal.city.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const generatedSlug = name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                      setFranchiseModal((prev) => ({
                        ...prev,
                        city: {
                          ...prev.city,
                          name,
                          slug: prev.city.slug && prev.city.slug !== `${prev.city.name.toLowerCase().replace(/\s+/g, '-')}-${prev.city.state.toLowerCase()}` ? prev.city.slug : `${generatedSlug}-${prev.city.state.toLowerCase()}`,
                        },
                      }));
                    }}
                    placeholder="Ex: Cascavel"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Estado (UF) *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={franchiseModal.city.state}
                    onChange={(e) => {
                      const state = e.target.value.toUpperCase();
                      setFranchiseModal((prev) => ({
                        ...prev,
                        city: { ...prev.city, state },
                      }));
                    }}
                    placeholder="PR"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Slug do Portal (Rota Web) *
                </label>
                <div className="flex items-center">
                  <span className="bg-purple-950/80 border border-r-0 border-purple-900/60 text-purple-400 px-3 py-2 rounded-l-xl font-mono text-[11px]">
                    venoapp.com.br/
                  </span>
                  <input
                    type="text"
                    required
                    value={franchiseModal.city.slug}
                    onChange={(e) =>
                      setFranchiseModal((prev) => ({
                        ...prev,
                        city: { ...prev.city, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') },
                      }))
                    }
                    placeholder="cascavel-pr"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-r-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Slogan / Headline da Cidade</label>
                <input
                  type="text"
                  value={franchiseModal.city.headline}
                  onChange={(e) =>
                    setFranchiseModal((prev) => ({
                      ...prev,
                      city: { ...prev.city, headline: e.target.value },
                    }))
                  }
                  placeholder="Ex: O portal definitivo dos eventos e comércios de Cascavel"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">URL da Imagem de Capa (Hero)</label>
                <input
                  type="text"
                  value={franchiseModal.city.hero_image}
                  onChange={(e) =>
                    setFranchiseModal((prev) => ({
                      ...prev,
                      city: { ...prev.city, hero_image: e.target.value },
                    }))
                  }
                  placeholder="Ex: https://images.unsplash.com/... ou /assets/..."
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 border-t border-purple-900/40">
                <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider block mb-2">
                  Dados do Franqueado Local (Operador Comercial)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Nome do Franqueado</label>
                    <input
                      type="text"
                      value={franchiseModal.city.franchisee_name}
                      onChange={(e) =>
                        setFranchiseModal((prev) => ({
                          ...prev,
                          city: { ...prev.city, franchisee_name: e.target.value },
                        }))
                      }
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">WhatsApp Comercial *</label>
                    <input
                      type="tel"
                      value={franchiseModal.city.franchisee_phone}
                      onChange={(e) =>
                        setFranchiseModal((prev) => ({
                          ...prev,
                          city: { ...prev.city, franchisee_phone: e.target.value },
                        }))
                      }
                      placeholder="(45) 99988-7766"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="mt-2.5">
                  <label className="block font-bold text-purple-200 mb-1">E-mail do Franqueado</label>
                  <input
                    type="email"
                    value={franchiseModal.city.franchisee_email}
                    onChange={(e) =>
                      setFranchiseModal((prev) => ({
                        ...prev,
                        city: { ...prev.city, franchisee_email: e.target.value },
                      }))
                    }
                    placeholder="cascavel@venoapp.com.br"
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setFranchiseModal((prev) => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-xl font-semibold text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={franchiseModal.submitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2 rounded-xl transition shadow-md shadow-amber-950/40 cursor-pointer disabled:opacity-50"
                >
                  {franchiseModal.submitting ? 'Cadastrando...' : 'Criar Franquia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: GERENCIAR ACESSO DO LOJISTA (/portal-parceiro) */}
      {/* ======================================================== */}
      {userAccessModal.open && userAccessModal.business && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b0730] border border-purple-700/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-purple-900/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Key className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Criar Acesso / Usuário</h3>
                  <p className="text-xs text-purple-300/80 truncate max-w-[240px]">
                    {userAccessModal.business.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserAccessModal((prev) => ({ ...prev, open: false, business: null }))}
                className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-purple-300/80 bg-purple-950/60 border border-purple-800/40 p-3 rounded-xl leading-relaxed">
              Defina as credenciais para o comerciante acessar o <strong>/portal-parceiro</strong> e gerenciar ofertas, cupons e perfil comercial desta empresa com total isolamento.
            </p>

            <form onSubmit={handleSaveUserAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  E-mail de Login do Comerciante *
                </label>
                <input
                  type="email"
                  value={userAccessModal.email}
                  onChange={(e) => setUserAccessModal((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="exemplo@empresa.com.br"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Usuário Alternativo (opcional)
                </label>
                <input
                  type="text"
                  value={userAccessModal.username}
                  onChange={(e) => setUserAccessModal((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="ex: pizzariabella"
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-purple-400/70 mt-1 block">
                  Permite que o lojista faça login tanto pelo e-mail quanto pelo usuário.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-200">
                    Senha de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.random().toString(36).slice(-8);
                      setUserAccessModal((prev) => ({ ...prev, password: randomPass }));
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Gerar Senha Forte
                  </button>
                </div>
                <input
                  type="text"
                  value={userAccessModal.password}
                  onChange={(e) => setUserAccessModal((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="Digite a senha do parceiro..."
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setUserAccessModal((prev) => ({ ...prev, open: false, business: null }))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userAccessModal.saving}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{userAccessModal.saving ? 'Salvando...' : 'Salvar Acesso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b0730] border border-rose-900/60 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 mx-auto flex items-center justify-center border border-rose-800/50">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-white">Confirmar Exclusão</h3>
              <p className="text-xs text-purple-300/80 mt-1.5 leading-relaxed">
                Tem certeza que deseja excluir <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, type: 'event', id: '', name: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
