import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CompanyProfileView } from './CompanyProfileView';
import {
  getBusinessById,
  getCities,
  getCityById,
  getOffersByBusiness,
  getEventsByBusiness,
  getAlbumsByBusiness,
} from '@/lib/supabase';
import { Building2, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 30;

export default async function CompanyProfilePage({ params }: PageProps) {
  const { id } = await params;

  const [company, allCities] = await Promise.all([
    getBusinessById(id),
    getCities(),
  ]);

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans">
        <Navbar allCities={allCities} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Empresa não encontrada</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              O estabelecimento solicitado não foi localizado ou o endereço informado está incorreto.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#7b2dc7] hover:bg-[#6824ab] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const city = await getCityById(company.city_id);
  const currentCity = city || allCities[0];

  const [offers, events, albums] = await Promise.all([
    getOffersByBusiness(company.id),
    getEventsByBusiness(company.id),
    getAlbumsByBusiness(company.id),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentCity={currentCity} allCities={allCities} />

      {/* Main Profile View */}
      <main className="flex-1">
        <CompanyProfileView
          company={company}
          city={currentCity}
          offers={offers}
          events={events}
          albums={albums}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">venoapp</span>
            <span>•</span>
            <span>{currentCity.name} - {currentCity.state || 'PR'}</span>
            <span>•</span>
            <Link
              href={`/anunciar?cidade=${currentCity.slug}`}
              className="text-[#7b2dc7] hover:underline font-bold"
            >
              Anuncie sua Empresa
            </Link>
            <span>•</span>
            <Link
              href="/portal-parceiro"
              className="text-slate-600 hover:text-[#7b2dc7] hover:underline font-medium"
            >
              Portal do Parceiro
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp Franquias. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
