const fs = require('fs');
const path = require('path');

function previewWelcomeEmail() {
  try {
    console.log('👀 Gerando preview do email de welcome...');
    
    // Ler o template de welcome atualizado
    const templatePath = path.join(__dirname, 'src/templates/email/welcome.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Substituir variáveis do template
    htmlTemplate = htmlTemplate
      .replace(/{{userName}}/g, 'Juan')
      .replace(/{{companyName}}/g, 'Navi')
      .replace(/{{companyLogo}}/g, 'https://via.placeholder.com/120x32/4B5563/FFFFFF?text=NAVI')
      .replace(/{{loginUrl}}/g, 'http://localhost:3000/login')
      .replace(/{{dashboardUrl}}/g, 'http://localhost:3000/dashboard')
      .replace(/{{supportEmail}}/g, 'suporte@coinage.app')
      .replace(/{{supportUrl}}/g, 'http://localhost:3000/support')
      .replace(/{{termsUrl}}/g, 'http://localhost:3000/terms')
      .replace(/{{privacyUrl}}/g, 'http://localhost:3000/privacy');

    // Salvar preview
    const previewPath = path.join(__dirname, 'email-preview-welcome.html');
    fs.writeFileSync(previewPath, htmlTemplate);
    
    console.log('✅ Preview gerado com sucesso!');
    console.log('📧 Destinatário: juansilveira@gmail.com');
    console.log('📋 Assunto: Bem-vindo ao Coinage - Conta Criada com Sucesso');
    console.log('🔗 Preview salvo em:', previewPath);
    console.log('');
    console.log('📊 Características do template minimalista aplicadas:');
    console.log('✓ Background sólido (#485586) ao invés de gradiente');
    console.log('✓ Header mais limpo com menos opacidade');
    console.log('✓ Footer minimalista e reduzido');
    console.log('✓ Emojis removidos do título e features');
    console.log('✓ Texto mais conciso e direto');
    console.log('✓ Design profissional e clean');
    console.log('');
    console.log('📝 Conteúdo do email:');
    console.log('• Título: "Bem-vindo ao Coinage" (sem emoji)');
    console.log('• Subtítulo: "Sua conta foi criada com sucesso"');
    console.log('• Features com bullet points simples');
    console.log('• Call-to-action para acessar dashboard');
    console.log('• Footer minimalista com apenas logo e link');
    
  } catch (error) {
    console.error('❌ Erro ao gerar preview:', error.message);
  }
}

previewWelcomeEmail();