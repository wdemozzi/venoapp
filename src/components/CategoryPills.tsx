import React from 'react';
import Link from 'next/link';
import { Calendar, Camera, Building2, Tag, MapPin } from 'lucide-react';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  href: string;
}

const categories: CategoryItem[] = [
  {
    id: 'eventos',
    title: 'Eventos',
    subtitle: 'O que vai rolar',
    icon: Calendar,
    href: '#eventos',
  },
  {
    id: 'fotos',
    title: 'Fotos',
    subtitle: 'Reviva os melhores momentos',
    icon: Camera,
    href: '/fotos',
  },
  {
    id: 'empresas',
    title: 'Empresas',
    subtitle: 'Compre, contrate, conheça',
    icon: Building2,
    href: '#empresas',
  },
  {
    id: 'ofertas',
    title: 'Ofertas',
    subtitle: 'Descontos e promoções',
    icon: Tag,
    href: '#ofertas',
  },
  {
    id: 'explorar',
    title: 'Explorar',
    subtitle: 'Conheça a cidade',
    icon: MapPin,
    href: '#explorar',
  },
];

export const CategoryPills: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.id}
            href={cat.href}
            className="group bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            {/* Icon Bubble */}
            <div className="w-12 h-12 rounded-full bg-[#f3eaff] group-hover:bg-[#ebd9ff] flex items-center justify-center text-[#7b2dc7] mb-2.5 transition-colors">
              <Icon className="w-5 h-5" />
            </div>

            {/* Title */}
            <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] group-hover:text-[#7b2dc7] transition-colors">
              {cat.title}
            </h3>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-normal line-clamp-1">
              {cat.subtitle}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
