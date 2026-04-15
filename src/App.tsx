import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Stethoscope, 
  User, 
  Pill, 
  TestTube, 
  AlertTriangle, 
  ClipboardList, 
  Printer, 
  Save,
  Activity,
  Search,
  ChevronRight,
  ChevronDown,
  Info,
  RotateCcw,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { 
  Medication, 
  LabExam, 
  Allergy, 
  PatientInfo, 
  PrescriberInfo, 
  Evolution, 
  PharmacotherapeuticForm 
} from './types';
import { analyzeInteractions } from './services/gemini';

export default function App() {
  const [form, setForm] = useState<PharmacotherapeuticForm>({
    patient: { name: '', age: '', gender: '', weight: '', height: '' },
    prescriber: { name: '', crm: '', specialty: '', contact: '' },
    allergies: [],
    medications: [],
    labExams: [],
    evolution: { pharmacistObservations: '', patientReportedSideEffects: '', adverseReactions: '' }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('patient');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [expandedAnalytes, setExpandedAnalytes] = useState<string[]>([]);
  const [examViewMode, setExamViewMode] = useState<'table' | 'historical'>('table');

  const initialForm: PharmacotherapeuticForm = {
    patient: { name: '', age: '', gender: '', weight: '', height: '' },
    prescriber: { name: '', crm: '', specialty: '', contact: '' },
    allergies: [],
    medications: [],
    labExams: [],
    evolution: { pharmacistObservations: '', patientReportedSideEffects: '', adverseReactions: '', observedInteractions: '' }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pharma_form');
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved form", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('pharma_form', JSON.stringify(form));
  }, [form]);

  const handlePatientChange = (field: keyof PatientInfo, value: string) => {
    setForm(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }));
  };

  const handlePrescriberChange = (field: keyof PrescriberInfo, value: string) => {
    setForm(prev => ({ ...prev, prescriber: { ...prev.prescriber, [field]: value } }));
  };

  const handleEvolutionChange = (field: keyof Evolution, value: string) => {
    setForm(prev => ({ ...prev, evolution: { ...prev.evolution, [field]: value } }));
  };

  const addMedication = () => {
    const newMed: Medication = {
      id: crypto.randomUUID(),
      name: '',
      dosage: '',
      frequency: '',
      schedule: '',
      startDate: '',
      endDate: '',
      discontinuationReason: '',
      purpose: ''
    };
    setForm(prev => ({ ...prev, medications: [...prev.medications, newMed] }));
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setForm(prev => ({
      ...prev,
      medications: prev.medications.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const removeMedication = (id: string) => {
    setForm(prev => ({ ...prev, medications: prev.medications.filter(m => m.id !== id) }));
  };

  const addLabExam = () => {
    const newExam: LabExam = {
      id: crypto.randomUUID(),
      analyte: '',
      value: '',
      referenceRange: '',
      date: format(new Date(), 'yyyy-MM-dd')
    };
    setForm(prev => ({ ...prev, labExams: [...prev.labExams, newExam] }));
  };

  const updateLabExam = (id: string, field: keyof LabExam, value: string) => {
    setForm(prev => ({
      ...prev,
      labExams: prev.labExams.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const removeLabExam = (id: string) => {
    setForm(prev => ({ ...prev, labExams: prev.labExams.filter(e => e.id !== id) }));
  };

  const toggleAnalyteExpansion = (analyte: string) => {
    setExpandedAnalytes(prev => 
      prev.includes(analyte) ? prev.filter(a => a !== analyte) : [...prev, analyte]
    );
  };

  const getGroupedExams = () => {
    const groups: Record<string, LabExam[]> = {};
    form.labExams.forEach(exam => {
      const name = exam.analyte.trim().toUpperCase() || 'SEM NOME';
      if (!groups[name]) groups[name] = [];
      groups[name].push(exam);
    });
    
    // Sort each group by date
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return groups;
  };

  const addAllergy = () => {
    const newAllergy: Allergy = {
      id: crypto.randomUUID(),
      substance: '',
      reaction: ''
    };
    setForm(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy] }));
  };

  const updateAllergy = (id: string, field: keyof Allergy, value: string) => {
    setForm(prev => ({
      ...prev,
      allergies: prev.allergies.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const removeAllergy = (id: string) => {
    setForm(prev => ({ ...prev, allergies: prev.allergies.filter(a => a.id !== id) }));
  };

  const handleReset = () => {
    setForm(initialForm);
    setAnalysisResult(null);
    setActiveTab('patient');
    setIsResetDialogOpen(false);
    localStorage.removeItem('pharma_form');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeInteractions(form.medications, form.allergies);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setActiveTab('interactions');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl text-white">
              <ClipboardList size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acompanhamento Farmacoterapêutico</h1>
              <p className="text-slate-500 text-sm font-medium">Monitoramento Clínico e Evolução do Paciente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger render={<Button variant="ghost" className="gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50" />}>
                <RotateCcw size={18} />
                Limpar
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Limpar Formulário?</DialogTitle>
                  <DialogDescription>
                    Esta ação irá apagar todos os dados preenchidos e não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleReset}>Confirmar e Limpar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-200 hover:bg-slate-50">
              <FileDown size={18} />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-200 hover:bg-slate-50 print:hidden">
              <Printer size={18} />
              Imprimir
            </Button>
            <Button onClick={() => alert('Dados salvos localmente.')} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Save size={18} />
              Salvar
            </Button>
          </div>
        </header>

        {/* Print Only Content (Full Report) */}
        <div className="hidden print:block space-y-8">
          <section>
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Dados do Paciente</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Nome:</strong> {form.patient.name || 'N/A'}</p>
              <p><strong>Idade:</strong> {form.patient.age || 'N/A'}</p>
              <p><strong>Gênero:</strong> {form.patient.gender || 'N/A'}</p>
              <p><strong>Peso:</strong> {form.patient.weight} kg</p>
              <p><strong>Altura:</strong> {form.patient.height} cm</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Médico Prescritor</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Nome:</strong> {form.prescriber.name || 'N/A'}</p>
              <p><strong>CRM:</strong> {form.prescriber.crm || 'N/A'}</p>
              <p><strong>Especialidade:</strong> {form.prescriber.specialty || 'N/A'}</p>
              <p><strong>Contato:</strong> {form.prescriber.contact || 'N/A'}</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Alergias</h2>
            {form.allergies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Substância</TableHead>
                    <TableHead>Reação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.allergies.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.substance}</TableCell>
                      <TableCell>{a.reaction}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm">Nenhuma alergia registrada.</p>}
          </section>

                  <section>
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Medicações</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Freq.</TableHead>
                  <TableHead>Horários</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim / Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.medications.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-bold">{m.name}</TableCell>
                    <TableCell>{m.dosage}</TableCell>
                    <TableCell>{m.frequency}</TableCell>
                    <TableCell>{m.schedule}</TableCell>
                    <TableCell>{m.startDate}</TableCell>
                    <TableCell>
                      {m.endDate ? `${m.endDate}${m.discontinuationReason ? ` - ${m.discontinuationReason}` : ''}` : 'Em uso'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Exames Laboratoriais</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analito</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.labExams.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.analyte}</TableCell>
                    <TableCell className="font-bold">{e.value}</TableCell>
                    <TableCell>{e.referenceRange}</TableCell>
                    <TableCell>{e.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Evolução e Observações</h2>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-500">Relato do Paciente (Efeitos Colaterais)</h3>
              <p className="text-sm mt-1">{form.evolution.patientReportedSideEffects || 'Nenhum relato.'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-500">Reações Adversas</h3>
              <p className="text-sm mt-1">{form.evolution.adverseReactions || 'Nenhuma observada.'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-500">Interações Identificadas</h3>
              <p className="text-sm mt-1">{form.evolution.observedInteractions || 'Nenhuma identificada.'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-500">Conduta Farmacêutica</h3>
              <p className="text-sm mt-1">{form.evolution.pharmacistObservations || 'Nenhuma observação.'}</p>
            </div>
          </section>

          {analysisResult && (
            <section>
              <h2 className="text-lg font-bold border-b-2 border-slate-900 pb-1 mb-4 uppercase">Análise de Interações (IA)</h2>
              <div className="text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                {analysisResult}
              </div>
            </section>
          )}
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-8 print:hidden">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-1 space-y-2 print:hidden">
            <nav className="space-y-1">
              {[
                { id: 'patient', label: 'Dados do Paciente', icon: User },
                { id: 'prescriber', label: 'Médico Prescritor', icon: Stethoscope },
                { id: 'allergies', label: 'Alergias e Reações', icon: AlertTriangle },
                { id: 'medications', label: 'Medicações', icon: Pill },
                { id: 'exams', label: 'Exames Laboratoriais', icon: TestTube },
                { id: 'evolution', label: 'Evolução Clínica', icon: Activity },
                { id: 'interactions', label: 'Interações (IA)', icon: Search },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
                  {item.label}
                  {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
                </button>
              ))}
            </nav>

            <Separator className="my-6" />

            <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Search size={120} />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Análise de IA</CardTitle>
                <CardDescription className="text-blue-100 text-xs">
                  Verifique interações medicamentosas potenciais usando Gemini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || form.medications.length === 0}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold"
                >
                  {isAnalyzing ? 'Analisando...' : 'Analisar Interações'}
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Form Content */}
          <div className="lg:col-span-3 space-y-6 print:lg:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'patient' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="text-blue-600" size={20} />
                        Dados do Paciente
                      </CardTitle>
                      <CardDescription>Informações básicas para identificação e cálculos clínicos.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          value={form.patient.name} 
                          onChange={(e) => handlePatientChange('name', e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="border-slate-200 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Idade</Label>
                        <Input 
                          id="age" 
                          type="number" 
                          value={form.patient.age} 
                          onChange={(e) => handlePatientChange('age', e.target.value)}
                          placeholder="Ex: 45"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gênero</Label>
                        <Select value={form.patient.gender} onValueChange={(v) => handlePatientChange('gender', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input 
                          id="weight" 
                          type="number" 
                          value={form.patient.weight} 
                          onChange={(e) => handlePatientChange('weight', e.target.value)}
                          placeholder="Ex: 75.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Altura (cm)</Label>
                        <Input 
                          id="height" 
                          type="number" 
                          value={form.patient.height} 
                          onChange={(e) => handlePatientChange('height', e.target.value)}
                          placeholder="Ex: 175"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'prescriber' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="text-blue-600" size={20} />
                        Médico Prescritor
                      </CardTitle>
                      <CardDescription>Dados do profissional responsável pelo tratamento.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="p-name">Nome do Médico</Label>
                        <Input 
                          id="p-name" 
                          value={form.prescriber.name} 
                          onChange={(e) => handlePrescriberChange('name', e.target.value)}
                          placeholder="Ex: Dr. Carlos Eduardo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="crm">CRM</Label>
                        <Input 
                          id="crm" 
                          value={form.prescriber.crm} 
                          onChange={(e) => handlePrescriberChange('crm', e.target.value)}
                          placeholder="Ex: 123456-SP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Input 
                          id="specialty" 
                          value={form.prescriber.specialty} 
                          onChange={(e) => handlePrescriberChange('specialty', e.target.value)}
                          placeholder="Ex: Cardiologia"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="contact">Contato / Hospital</Label>
                        <Input 
                          id="contact" 
                          value={form.prescriber.contact} 
                          onChange={(e) => handlePrescriberChange('contact', e.target.value)}
                          placeholder="Ex: Hospital das Clínicas - (11) 9999-9999"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'allergies' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="text-amber-500" size={20} />
                          Histórico de Alergias
                        </CardTitle>
                        <CardDescription>Registro de substâncias e reações adversas anteriores.</CardDescription>
                      </div>
                      <Button onClick={addAllergy} variant="outline" size="sm" className="gap-2 border-slate-200">
                        <Plus size={16} />
                        Adicionar
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {form.allergies.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                            <AlertTriangle className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-500 text-sm">Nenhuma alergia registrada.</p>
                          </div>
                        ) : (
                          form.allergies.map((allergy) => (
                            <div key={allergy.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 group">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Substância / Medicamento</Label>
                                  <Input 
                                    value={allergy.substance} 
                                    onChange={(e) => updateAllergy(allergy.id, 'substance', e.target.value)}
                                    placeholder="Ex: Penicilina"
                                    className="bg-white"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Reação Observada</Label>
                                  <Input 
                                    value={allergy.reaction} 
                                    onChange={(e) => updateAllergy(allergy.id, 'reaction', e.target.value)}
                                    placeholder="Ex: Rash cutâneo, edema"
                                    className="bg-white"
                                  />
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeAllergy(allergy.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 mt-6"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'medications' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="text-blue-600" size={20} />
                          Medicações em Uso
                        </CardTitle>
                        <CardDescription>Lista completa de medicamentos, dosagens e esquemas terapêuticos.</CardDescription>
                      </div>
                      <Button onClick={addMedication} variant="outline" size="sm" className="gap-2 border-slate-200">
                        <Plus size={16} />
                        Adicionar
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {form.medications.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                            <Pill className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-500 text-sm">Nenhum medicamento registrado.</p>
                          </div>
                        ) : (
                          form.medications.map((med) => (
                            <div key={med.id} className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medicamento</Label>
                                    <Input 
                                      value={med.name} 
                                      onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                                      placeholder="Nome do fármaco"
                                      className="font-semibold text-lg"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Início</Label>
                                    <Input 
                                      type="date"
                                      value={med.startDate} 
                                      onChange={(e) => updateMedication(med.id, 'startDate', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeMedication(med.id)}
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 ml-4"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Dosagem</Label>
                                  <Input 
                                    value={med.dosage} 
                                    onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                                    placeholder="Ex: 500mg"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Frequência</Label>
                                  <Input 
                                    value={med.frequency} 
                                    onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                                    placeholder="Ex: 12/12h"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Horários</Label>
                                  <Input 
                                    value={med.schedule} 
                                    onChange={(e) => updateMedication(med.id, 'schedule', e.target.value)}
                                    placeholder="Ex: 08:00, 20:00"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Data de Término (Opcional)</Label>
                                  <Input 
                                    type="date"
                                    value={med.endDate} 
                                    onChange={(e) => updateMedication(med.id, 'endDate', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Motivo da Descontinuação</Label>
                                  <Input 
                                    value={med.discontinuationReason} 
                                    onChange={(e) => updateMedication(med.id, 'discontinuationReason', e.target.value)}
                                    placeholder="Ex: Efeito colateral, fim do tratamento"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Indicação / Objetivo Terapêutico</Label>
                                <Input 
                                  value={med.purpose} 
                                  onChange={(e) => updateMedication(med.id, 'purpose', e.target.value)}
                                  placeholder="Ex: Controle de Hipertensão"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'exams' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TestTube className="text-blue-600" size={20} />
                          Exames Laboratoriais
                        </CardTitle>
                        <CardDescription>Acompanhamento de parâmetros bioquímicos e hematológicos.</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                          <Button 
                            variant={examViewMode === 'table' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setExamViewMode('table')}
                            className="text-xs h-8 px-3 shadow-none"
                          >
                            Tabela
                          </Button>
                          <Button 
                            variant={examViewMode === 'historical' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setExamViewMode('historical')}
                            className="text-xs h-8 px-3 shadow-none"
                          >
                            Histórico
                          </Button>
                        </div>
                        <Button onClick={addLabExam} variant="outline" size="sm" className="gap-2 border-slate-200">
                          <Plus size={16} />
                          Adicionar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {examViewMode === 'table' ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="w-[200px]">Analito</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Ref. / Unidade</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {form.labExams.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    Nenhum exame registrado.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                [...form.labExams].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exam) => (
                                  <TableRow key={exam.id} className="border-slate-100 group">
                                    <TableCell className="p-2">
                                      <Input 
                                        value={exam.analyte} 
                                        onChange={(e) => updateLabExam(exam.id, 'analyte', e.target.value)}
                                        placeholder="Ex: Creatinina"
                                        className="border-none shadow-none focus-visible:ring-1"
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                        value={exam.value} 
                                        onChange={(e) => updateLabExam(exam.id, 'value', e.target.value)}
                                        placeholder="Ex: 0.9"
                                        className="border-none shadow-none focus-visible:ring-1 font-bold"
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                        value={exam.referenceRange} 
                                        onChange={(e) => updateLabExam(exam.id, 'referenceRange', e.target.value)}
                                        placeholder="Ex: 0.7 - 1.3 mg/dL"
                                        className="border-none shadow-none focus-visible:ring-1 text-slate-500"
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                        type="date"
                                        value={exam.date} 
                                        onChange={(e) => updateLabExam(exam.id, 'date', e.target.value)}
                                        className="border-none shadow-none focus-visible:ring-1"
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeLabExam(exam.id)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(getGroupedExams()).length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                              Nenhum dado para exibir no histórico.
                            </div>
                          ) : (
                            Object.entries(getGroupedExams()).map(([analyte, exams]) => (
                              <div key={analyte} className="border border-slate-200 rounded-xl overflow-hidden">
                                <button 
                                  onClick={() => toggleAnalyteExpansion(analyte)}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{exams.length} exames</Badge>
                                    <span className="font-bold text-slate-700">{analyte}</span>
                                  </div>
                                  {expandedAnalytes.includes(analyte) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                
                                <AnimatePresence>
                                  {expandedAnalytes.includes(analyte) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 space-y-6 bg-white">
                                        {/* Chart */}
                                        <div className="h-[250px] w-full">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={exams.map(e => ({
                                              date: format(new Date(e.date), 'dd/MM/yy'),
                                              value: parseFloat(e.value.replace(',', '.')) || 0,
                                              original: e.value
                                            }))}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                              <XAxis 
                                                dataKey="date" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                stroke="#94a3b8"
                                              />
                                              <YAxis 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false}
                                                stroke="#94a3b8"
                                              />
                                              <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                              />
                                              <Line 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke="#2563eb" 
                                                strokeWidth={3} 
                                                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                              />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </div>

                                        {/* History Table */}
                                        <div className="rounded-lg border border-slate-100 overflow-hidden">
                                          <Table>
                                            <TableHeader className="bg-slate-50">
                                              <TableRow>
                                                <TableHead className="text-xs">Data</TableHead>
                                                <TableHead className="text-xs">Valor</TableHead>
                                                <TableHead className="text-xs">Referência</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {[...exams].reverse().map(e => (
                                                <TableRow key={e.id}>
                                                  <TableCell className="text-xs">{format(new Date(e.date), 'dd/MM/yyyy')}</TableCell>
                                                  <TableCell className="text-xs font-bold">{e.value}</TableCell>
                                                  <TableCell className="text-xs text-slate-500">{e.referenceRange}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'evolution' && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="text-blue-600" size={20} />
                        Evolução Clínica
                      </CardTitle>
                      <CardDescription>Registro de observações do farmacêutico e relatos do paciente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="side-effects" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Paciente</Badge>
                          Efeitos Colaterais Relatados
                        </Label>
                        <Textarea 
                          id="side-effects" 
                          value={form.evolution.patientReportedSideEffects} 
                          onChange={(e) => handleEvolutionChange('patientReportedSideEffects', e.target.value)}
                          placeholder="Descreva o que o paciente relatou sobre o uso dos medicamentos..."
                          className="min-h-[100px] border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adverse" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Crítico</Badge>
                          Reações Adversas
                        </Label>
                        <Textarea 
                          id="adverse" 
                          value={form.evolution.adverseReactions} 
                          onChange={(e) => handleEvolutionChange('adverseReactions', e.target.value)}
                          placeholder="Registre qualquer RAM (Reação Adversa a Medicamento) observada..."
                          className="min-h-[100px] border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interactions" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Segurança</Badge>
                          Interações Medicamentosas (Observadas ou Potenciais)
                        </Label>
                        <div className="relative">
                          <Textarea 
                            id="interactions" 
                            value={form.evolution.observedInteractions} 
                            onChange={(e) => handleEvolutionChange('observedInteractions', e.target.value)}
                            placeholder="Registre interações fármaco-fármaco ou fármaco-alimento identificadas..."
                            className="min-h-[100px] border-slate-200 pr-12"
                          />
                          <div className="absolute top-2 right-2">
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              title="Consultar Drugs.com"
                              onClick={() => window.open('https://www.drugs.com/drug_interactions.html', '_blank')}
                              className="text-slate-400 hover:text-blue-600"
                            >
                              <Search size={16} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Dica: Utilize a aba "Análise IA" para uma verificação automática baseada em evidências clínicas.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="obs" className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Farmacêutico</Badge>
                          Observações e Conduta
                        </Label>
                        <Textarea 
                          id="obs" 
                          value={form.evolution.pharmacistObservations} 
                          onChange={(e) => handleEvolutionChange('pharmacistObservations', e.target.value)}
                          placeholder="Anote sua análise clínica, intervenções e evolução do quadro..."
                          className="min-h-[150px] border-slate-200"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'interactions' && (
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Search size={20} />
                            Análise de Interações (Gemini AI)
                          </CardTitle>
                          <CardDescription className="text-slate-400">Análise automatizada baseada na lista atual de medicamentos.</CardDescription>
                        </div>
                        <Button 
                          onClick={handleAnalyze} 
                          disabled={isAnalyzing || form.medications.length === 0}
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                        >
                          {isAnalyzing ? 'Analisando...' : 'Re-analisar'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px] p-6">
                        {isAnalyzing ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-slate-900">Processando dados farmacológicos...</p>
                              <p className="text-slate-500 text-sm">O Gemini está analisando interações e riscos.</p>
                            </div>
                          </div>
                        ) : analysisResult ? (
                          <div className="prose prose-slate max-w-none">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3 items-start">
                              <Info className="text-blue-600 mt-1" size={20} />
                              <p className="text-sm text-blue-800 leading-relaxed">
                                <strong>Aviso Legal:</strong> Esta análise é gerada por Inteligência Artificial e deve ser validada por um profissional de saúde qualificado. Não substitui o julgamento clínico.
                              </p>
                            </div>
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                              {analysisResult}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full space-y-4 py-20 text-center">
                            <div className="bg-slate-100 p-6 rounded-full text-slate-400">
                              <Search size={48} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Nenhuma análise disponível</p>
                              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Clique no botão acima para iniciar a análise de interações medicamentosas.
                              </p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer / Summary for Print */}
        <footer className="hidden print:block border-t border-slate-200 pt-8 mt-12">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-slate-900 mb-2">Assinatura do Farmacêutico</p>
              <div className="h-12 border-b border-slate-300 mb-1"></div>
              <p className="text-slate-500">CRF: ____________________</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Data do Acompanhamento: {format(new Date(), 'dd/MM/yyyy')}</p>
              <p className="text-slate-400 text-xs mt-2">Gerado por PharmaTrack - Sistema de Gestão Farmacoterapêutica</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
