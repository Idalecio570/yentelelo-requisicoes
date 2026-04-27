-- Adiciona coluna de preferência de notificação por email ao perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_email BOOLEAN NOT NULL DEFAULT true;
