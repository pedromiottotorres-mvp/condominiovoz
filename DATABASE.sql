-- ============================================
-- CondomínioVoz — Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Cole tudo → Run
-- ============================================

-- ============================================
-- 1. TABELAS
-- ============================================

-- Condomínios
CREATE TABLE condominios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT DEFAULT 'São Paulo',
  tipo TEXT CHECK (tipo IN ('predio', 'casas', 'misto')) DEFAULT 'predio',
  total_unidades INTEGER NOT NULL DEFAULT 50,
  codigo_convite TEXT UNIQUE,                          -- código de 6 chars gerado automaticamente
  sindico_id UUID REFERENCES auth.users(id),           -- quem cadastrou
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'ativo')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perfis de usuário (estende o auth.users do Supabase)
-- Criados explicitamente na tela de cadastro (sem trigger automático)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  condominio_id UUID REFERENCES condominios(id) NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  apartamento TEXT,                                    -- NULL para síndico
  role TEXT NOT NULL DEFAULT 'morador'
    CHECK (role IN ('morador', 'sindico')),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'ativo', 'rejeitado')),
  avatar_url TEXT,
  aprovado_em TIMESTAMPTZ,
  aprovado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Demandas dos moradores
CREATE TABLE demandas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID REFERENCES condominios(id) NOT NULL,
  autor_id UUID REFERENCES profiles(id) NOT NULL,
  titulo TEXT NOT NULL CHECK (char_length(titulo) <= 100),
  descricao TEXT CHECK (char_length(descricao) <= 500),
  categoria TEXT NOT NULL CHECK (categoria IN ('manutencao', 'seguranca', 'lazer', 'estetica', 'estrutural', 'outro')),
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_votacao', 'aprovada', 'em_andamento', 'concluida', 'rejeitada')),
  foto_url TEXT,
  total_apoios INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Apoios (upvotes) nas demandas
CREATE TABLE apoios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demanda_id UUID REFERENCES demandas(id) ON DELETE CASCADE NOT NULL,
  morador_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(demanda_id, morador_id)  -- cada morador apoia cada demanda apenas 1 vez
);

-- Votações (pautas criadas pelo síndico)
CREATE TABLE votacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID REFERENCES condominios(id) NOT NULL,
  criador_id UUID REFERENCES profiles(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  orcamento_estimado DECIMAL(12,2),
  opcoes JSONB NOT NULL DEFAULT '["Sim", "Não", "Abstenção"]',
  prazo TIMESTAMPTZ NOT NULL,
  resultado_parcial_visivel BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  resultado JSONB,  -- preenchido ao encerrar: {"Sim": 25, "Não": 10, "Abstenção": 5, "quorum": 80}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vínculo entre votação e demandas relacionadas
CREATE TABLE votacao_demandas (
  votacao_id UUID REFERENCES votacoes(id) ON DELETE CASCADE,
  demanda_id UUID REFERENCES demandas(id) ON DELETE CASCADE,
  PRIMARY KEY (votacao_id, demanda_id)
);

-- Votos individuais
CREATE TABLE votos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  votacao_id UUID REFERENCES votacoes(id) ON DELETE CASCADE NOT NULL,
  morador_id UUID REFERENCES profiles(id) NOT NULL,
  apartamento TEXT NOT NULL,  -- para garantir 1 voto por unidade
  opcao_escolhida TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(votacao_id, apartamento)  -- 1 voto por unidade por votação
);

-- Itens do simulador de orçamento
CREATE TABLE orcamento_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID REFERENCES condominios(id) NOT NULL,
  demanda_id UUID REFERENCES demandas(id),
  descricao TEXT NOT NULL,
  custo_estimado DECIMAL(12,2) NOT NULL,
  prioridade INTEGER DEFAULT 0,
  aprovado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

CREATE INDEX idx_demandas_condominio ON demandas(condominio_id);
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_apoios ON demandas(total_apoios DESC);
CREATE INDEX idx_apoios_demanda ON apoios(demanda_id);
CREATE INDEX idx_votacoes_condominio ON votacoes(condominio_id);
CREATE INDEX idx_votos_votacao ON votos(votacao_id);
CREATE INDEX idx_profiles_condominio ON profiles(condominio_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_condominios_codigo ON condominios(codigo_convite);

-- ============================================
-- 3. FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar total_apoios quando um apoio é criado ou removido
CREATE OR REPLACE FUNCTION update_total_apoios()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE demandas SET total_apoios = total_apoios + 1, updated_at = now()
    WHERE id = NEW.demanda_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE demandas SET total_apoios = total_apoios - 1, updated_at = now()
    WHERE id = OLD.demanda_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_apoios_insert
  AFTER INSERT ON apoios
  FOR EACH ROW EXECUTE FUNCTION update_total_apoios();

CREATE TRIGGER trigger_update_apoios_delete
  AFTER DELETE ON apoios
  FOR EACH ROW EXECUTE FUNCTION update_total_apoios();

-- Função para gerar código de convite único (6 chars alfanuméricos, sem caracteres ambíguos)
CREATE OR REPLACE FUNCTION generate_codigo_convite()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código de convite automaticamente ao criar condomínio
CREATE OR REPLACE FUNCTION set_codigo_convite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_convite IS NULL THEN
    LOOP
      NEW.codigo_convite := generate_codigo_convite();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM condominios WHERE codigo_convite = NEW.codigo_convite
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_codigo_convite
  BEFORE INSERT ON condominios
  FOR EACH ROW EXECUTE FUNCTION set_codigo_convite();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE apoios ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacao_demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

-- ── Condominios ──────────────────────────────────────────────────────────────

-- Leitura pública: necessário para validar código de convite antes do cadastro
-- e para usuários autenticados verem seu condomínio
CREATE POLICY "Leitura publica de condominios" ON condominios
  FOR SELECT USING (true);

-- Qualquer usuário autenticado pode criar um condomínio (fluxo de cadastro do síndico)
-- O vínculo com o síndico é feito via sindico_id na tabela
CREATE POLICY "Autenticado cria condominio" ON condominios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Síndico pode atualizar os dados do seu condomínio
CREATE POLICY "Sindico atualiza condominio" ON condominios
  FOR UPDATE USING (sindico_id = auth.uid());

-- ── Profiles ─────────────────────────────────────────────────────────────────

-- Ver perfis do mesmo condomínio (moradores ativos e pendentes)
CREATE POLICY "Ver perfis do mesmo condominio" ON profiles
  FOR SELECT USING (
    condominio_id IN (SELECT condominio_id FROM profiles WHERE id = auth.uid())
  );

-- Usuário insere o próprio perfil (sem perfil prévio, via id = auth.uid())
CREATE POLICY "Inserir proprio perfil" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Usuário atualiza o próprio perfil (nome, avatar, etc.)
CREATE POLICY "Atualizar proprio perfil" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Síndico pode aprovar/rejeitar moradores do seu condomínio
CREATE POLICY "Sindico gerencia moradores" ON profiles
  FOR UPDATE USING (
    condominio_id IN (
      SELECT condominio_id FROM profiles
      WHERE id = auth.uid() AND role = 'sindico'
    )
  );

-- ── Demandas ─────────────────────────────────────────────────────────────────

CREATE POLICY "Ver demandas do condominio" ON demandas
  FOR SELECT USING (
    condominio_id IN (SELECT condominio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Criar demanda no condominio" ON demandas
  FOR INSERT WITH CHECK (
    condominio_id IN (SELECT condominio_id FROM profiles WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

CREATE POLICY "Atualizar propria demanda" ON demandas
  FOR UPDATE USING (autor_id = auth.uid() AND status = 'aberta');

-- Síndico pode atualizar qualquer demanda do condomínio (para mudar status)
CREATE POLICY "Sindico atualiza demandas" ON demandas
  FOR UPDATE USING (
    condominio_id IN (
      SELECT condominio_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );

-- ── Apoios ───────────────────────────────────────────────────────────────────

CREATE POLICY "Ver apoios do condominio" ON apoios
  FOR SELECT USING (
    demanda_id IN (
      SELECT id FROM demandas WHERE condominio_id IN (
        SELECT condominio_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Criar apoio" ON apoios
  FOR INSERT WITH CHECK (morador_id = auth.uid());

CREATE POLICY "Remover proprio apoio" ON apoios
  FOR DELETE USING (morador_id = auth.uid());

-- ── Votações ─────────────────────────────────────────────────────────────────

CREATE POLICY "Ver votacoes do condominio" ON votacoes
  FOR SELECT USING (
    condominio_id IN (SELECT condominio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Sindico cria votacao" ON votacoes
  FOR INSERT WITH CHECK (
    criador_id = auth.uid()
    AND condominio_id IN (
      SELECT condominio_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );

CREATE POLICY "Sindico atualiza votacao" ON votacoes
  FOR UPDATE USING (
    criador_id = auth.uid()
    AND condominio_id IN (
      SELECT condominio_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );

-- ── Votos ────────────────────────────────────────────────────────────────────

CREATE POLICY "Ver votos da votacao" ON votos
  FOR SELECT USING (
    votacao_id IN (
      SELECT id FROM votacoes WHERE condominio_id IN (
        SELECT condominio_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Morador vota" ON votos
  FOR INSERT WITH CHECK (morador_id = auth.uid());

-- ── Votação-Demandas ─────────────────────────────────────────────────────────

CREATE POLICY "Ver vinculo votacao-demanda" ON votacao_demandas
  FOR SELECT USING (
    votacao_id IN (
      SELECT id FROM votacoes WHERE condominio_id IN (
        SELECT condominio_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Sindico vincula demanda a votacao" ON votacao_demandas
  FOR INSERT WITH CHECK (
    votacao_id IN (
      SELECT id FROM votacoes WHERE criador_id = auth.uid()
    )
  );

-- ── Orçamento ────────────────────────────────────────────────────────────────

CREATE POLICY "Ver orcamento do condominio" ON orcamento_itens
  FOR SELECT USING (
    condominio_id IN (SELECT condominio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Sindico gerencia orcamento" ON orcamento_itens
  FOR ALL USING (
    condominio_id IN (
      SELECT condominio_id FROM profiles WHERE id = auth.uid() AND role = 'sindico'
    )
  );

-- ============================================
-- 5. DADOS INICIAIS (para teste local)
-- ============================================

-- Condomínio de teste (já com código de convite fixo e status ativo)
INSERT INTO condominios (id, nome, endereco, cidade, tipo, total_unidades, codigo_convite, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Edifício Moema Park',
  'Rua dos Moradores, 123 - Moema',
  'São Paulo',
  'predio',
  48,
  'TEST01',
  'ativo'
);

-- NOTA: Perfis são criados pelo próprio usuário na tela de cadastro (/login).
-- Para transformar um usuário em síndico do condomínio de teste, atualize manualmente:
--   UPDATE profiles SET role = 'sindico', status = 'ativo' WHERE id = '<user-uuid>';
