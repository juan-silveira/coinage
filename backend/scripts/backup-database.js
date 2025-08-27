#!/usr/bin/env node

/**
 * Script de Backup Automatizado do Banco de Dados
 * Cria backups do PostgreSQL com compressão e rotação
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configurações
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 7; // Manter últimos 7 backups
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5433';
const DB_NAME = process.env.DB_NAME || 'coinage';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

class DatabaseBackup {
  constructor() {
    this.ensureBackupDirectory();
  }

  /**
   * Garante que o diretório de backup existe
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 Diretório de backup criado: ${BACKUP_DIR}`);
    }
  }

  /**
   * Gera nome do arquivo de backup com timestamp
   */
  generateBackupFilename() {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('T').join('_');
    return `backup_${DB_NAME}_${timestamp}.sql.gz`;
  }

  /**
   * Executa backup do banco de dados
   */
  async performBackup() {
    const filename = this.generateBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);
    
    console.log('🔄 Iniciando backup do banco de dados...');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`   Arquivo: ${filename}`);

    try {
      // Comando pg_dump com compressão
      const command = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl | gzip > ${filepath}`;
      
      // Para Docker, usar comando alternativo
      const dockerCommand = `docker exec coinage_postgres pg_dump -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl | gzip > ${filepath}`;
      
      // Tentar primeiro com Docker
      try {
        await execPromise(dockerCommand);
        // console.log('✅ Backup realizado via Docker container');
      } catch (dockerError) {
        // Se falhar, tentar comando direto
        // console.log('⚠️ Docker não disponível, tentando backup direto...');
        await execPromise(command);
        // console.log('✅ Backup realizado diretamente');
      }

      // Verificar tamanho do arquivo
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      // console.log(`✅ Backup concluído com sucesso!`);
      // console.log(`   Tamanho: ${sizeMB} MB`);
      // console.log(`   Local: ${filepath}`);
      
      return { success: true, filepath, size: sizeMB };
    } catch (error) {
      console.error('❌ Erro ao realizar backup:', error.message);
      throw error;
    }
  }

  /**
   * Restaura backup do banco de dados
   */
  async restoreBackup(backupFile) {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupFile}`);
    }

    console.log('🔄 Iniciando restauração do banco de dados...');
    console.log(`   Arquivo: ${backupFile}`);

    try {
      // Comando para restaurar
      const command = `gunzip -c ${backupFile} | PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}`;
      
      // Para Docker
      const dockerCommand = `gunzip -c ${backupFile} | docker exec -i coinage_postgres psql -U ${DB_USER} -d ${DB_NAME}`;
      
      try {
        await execPromise(dockerCommand);
        console.log('✅ Restauração realizada via Docker container');
      } catch (dockerError) {
        console.log('⚠️ Docker não disponível, tentando restauração direta...');
        await execPromise(command);
        console.log('✅ Restauração realizada diretamente');
      }
      
      console.log('✅ Banco de dados restaurado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  listBackups() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.sql.gz'))
        .map(file => {
          const filepath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            path: filepath,
            size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);

      console.log(`📋 Backups disponíveis (${files.length}):`);
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename}`);
        console.log(`      Tamanho: ${file.size}`);
        console.log(`      Criado: ${file.created.toLocaleString()}`);
      });

      return files;
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error.message);
      return [];
    }
  }

  /**
   * Remove backups antigos mantendo apenas os mais recentes
   */
  async rotateBackups() {
    try {
      const files = this.listBackups();
      
      if (files.length <= MAX_BACKUPS) {
        console.log(`✅ Rotação não necessária (${files.length}/${MAX_BACKUPS} backups)`);
        return;
      }

      const filesToDelete = files.slice(MAX_BACKUPS);
      console.log(`🗑️ Removendo ${filesToDelete.length} backups antigos...`);

      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`   Removido: ${file.filename}`);
      }

      console.log('✅ Rotação de backups concluída');
    } catch (error) {
      console.error('❌ Erro na rotação de backups:', error.message);
    }
  }

  /**
   * Verifica integridade do backup
   */
  async verifyBackup(backupFile) {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupFile}`);
    }

    console.log('🔍 Verificando integridade do backup...');

    try {
      // Testa se o arquivo pode ser descompactado
      const command = `gunzip -t ${backupFile}`;
      await execPromise(command);
      
      console.log('✅ Backup íntegro e válido');
      return true;
    } catch (error) {
      console.error('❌ Backup corrompido ou inválido:', error.message);
      return false;
    }
  }

  /**
   * Backup automatizado com rotação
   */
  async autoBackup() {
    try {
      console.log('🚀 Iniciando backup automatizado...');
      console.log('=====================================');
      
      // Realizar backup
      const result = await this.performBackup();
      
      // Verificar integridade
      await this.verifyBackup(result.filepath);
      
      // Rotacionar backups antigos
      await this.rotateBackups();
      
      console.log('=====================================');
      console.log('🎉 Backup automatizado concluído com sucesso!');
      
      return result;
    } catch (error) {
      console.error('❌ Falha no backup automatizado:', error.message);
      throw error;
    }
  }

  /**
   * Agenda backup periódico
   */
  scheduleBackups(intervalHours = 24) {
    console.log(`⏰ Agendando backups a cada ${intervalHours} horas`);
    
    // Executar primeiro backup imediatamente
    this.autoBackup().catch(console.error);
    
    // Agendar próximos backups
    setInterval(() => {
      this.autoBackup().catch(console.error);
    }, intervalHours * 60 * 60 * 1000);
  }
}

// CLI Interface
if (require.main === module) {
  const backup = new DatabaseBackup();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'backup':
      backup.autoBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'restore':
      const file = args[1];
      if (!file) {
        console.error('❌ Especifique o arquivo de backup para restaurar');
        process.exit(1);
      }
      backup.restoreBackup(file)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      backup.listBackups();
      break;
      
    case 'rotate':
      backup.rotateBackups()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'verify':
      const backupFile = args[1];
      if (!backupFile) {
        console.error('❌ Especifique o arquivo de backup para verificar');
        process.exit(1);
      }
      backup.verifyBackup(backupFile)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'schedule':
      const hours = parseInt(args[1]) || 24;
      backup.scheduleBackups(hours);
      console.log('⏰ Backup agendado. Mantenha o processo rodando...');
      break;
      
    default:
      console.log('📚 Uso: node backup-database.js <comando> [opções]');
      console.log('');
      console.log('Comandos:');
      console.log('  backup              - Realizar backup agora');
      console.log('  restore <arquivo>   - Restaurar backup');
      console.log('  list               - Listar backups disponíveis');
      console.log('  rotate             - Remover backups antigos');
      console.log('  verify <arquivo>   - Verificar integridade do backup');
      console.log('  schedule [horas]   - Agendar backups periódicos');
      process.exit(0);
  }
}

module.exports = DatabaseBackup;