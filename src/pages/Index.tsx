import React from 'react'
import { Link } from 'react-router-dom'
import { HeartCrack, HeartHandshake, ArrowRight, Sparkles, PawPrint } from 'lucide-react'
import { usePets } from '@/context/PetContext'
import { AnimalCard } from '@/components/AnimalCard'

export default function Index() {
  const { animais } = usePets()

  // Primeiros 3 cards de exemplo para a prévia da Home
  const previaAnimais = animais.slice(0, 3)

  return (
    <div className="space-y-12 md:space-y-16 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#faf7f2] via-[#faf7f2] to-[#e8f5e9] border border-[#e5e0d8] p-6 sm:p-10 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center animate-fade-in-up">
        {/* Elementos decorativos de fundo */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#2d8f6f]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#f49b4f]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e5e0d8] text-xs font-semibold text-[#2d8f6f] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#f49b4f]" />
            <span>Unindo lares e corações em todo o Brasil</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2b2b2b] leading-[1.15]">
            Perdeu ou encontrou um animal?
          </h1>

          <p className="text-base sm:text-lg text-[#6b6b6b] leading-relaxed max-w-xl mx-auto">
            Cadastre aqui e ajude a reunir um pet à sua família. Cada detalhe faz a diferença para
            um reencontro feliz.
          </p>
        </div>

        {/* As DUAS Opções Claras em Cards Grandes Clicáveis */}
        <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto relative z-10 text-left">
          {/* Card 1: Perdi meu animal */}
          <Link
            to="/cadastro?perdido=true"
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-[20px] bg-white border-2 border-[#e5e0d8] hover:border-[#d9534f] shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(217,83,79,0.15)] hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#d9534f]/20"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#fdecea] text-[#d9534f] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-[#d9534f] group-hover:text-white transition-all duration-300">
                <HeartCrack className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d9534f]">
                  Busca & Divulgação
                </span>
                <h2 className="text-2xl font-bold text-[#2b2b2b] mt-1 group-hover:text-[#d9534f] transition-colors">
                  Perdi meu animal
                </h2>
                <p className="text-sm text-[#6b6b6b] mt-2 leading-relaxed">
                  Cadastre as informações do seu pet para divulgarmos a busca.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e5e0d8]/70 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#d9534f] group-hover:translate-x-1 transition-transform">
                <span>Quero cadastrar</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-xs text-[#6b6b6b]">Leva 2 minutos</span>
            </div>
          </Link>

          {/* Card 2: Achei um animal */}
          <Link
            to="/cadastro?perdido=false"
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-[20px] bg-white border-2 border-[#e5e0d8] hover:border-[#2d8f6f] shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(45,143,111,0.15)] hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#2d8f6f]/20"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f5e9] text-[#2d8f6f] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-[#2d8f6f] group-hover:text-white transition-all duration-300">
                <HeartHandshake className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d8f6f]">
                  Acolhimento & Resgate
                </span>
                <h2 className="text-2xl font-bold text-[#2b2b2b] mt-1 group-hover:text-[#2d8f6f] transition-colors">
                  Achei um animal
                </h2>
                <p className="text-sm text-[#6b6b6b] mt-2 leading-relaxed">
                  Você encontrou um pet? Ajude a encontrar o tutor.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e5e0d8]/70 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#2d8f6f] group-hover:translate-x-1 transition-transform">
                <span>Quero cadastrar</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-xs text-[#6b6b6b]">Ajude um tutor</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Prévia da Lista de Animais */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f49b4f]">
              <PawPrint className="w-4 h-4" />
              <span>Cadastros Recentes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2b2b2b] mt-1">
              Últimos animais cadastrados
            </h2>
            <p className="text-sm text-[#6b6b6b] mt-1">
              Veja os pets que foram perdidos ou encontrados recentemente por outros membros da
              comunidade.
            </p>
          </div>

          <Link
            to="/animais"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d8f6f] hover:text-[#237a5e] transition-colors group shrink-0"
          >
            <span>Ver todos ({animais.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid de 3 cards de exemplo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previaAnimais.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>

        {/* Botão de destaque para ir para /animais */}
        <div className="text-center pt-4">
          <Link
            to="/animais"
            className="inline-flex items-center gap-2.5 bg-white hover:bg-[#faf7f2] text-[#2d8f6f] border-2 border-[#2d8f6f] hover:border-[#237a5e] px-6 py-3 rounded-[10px] font-semibold text-base shadow-sm hover:shadow transition-all duration-200 transform hover:scale-[1.02]"
          >
            <PawPrint className="w-5 h-5" />
            <span>Ver todos os animais cadastrados</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
