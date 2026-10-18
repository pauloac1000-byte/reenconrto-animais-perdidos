/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PetProvider } from '@/context/PetContext'
import Index from './pages/Index'
import Cadastro from './pages/Cadastro'
import Resumo from './pages/Resumo'
import Animais from './pages/Animais'
import AnimalDetalhe from './pages/AnimalDetalhe'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <PetProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/resumo" element={<Resumo />} />
            <Route path="/animais" element={<Animais />} />
            <Route path="/animal/:id" element={<AnimalDetalhe />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </PetProvider>
)

export default App
