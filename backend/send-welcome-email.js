const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function sendWelcomeEmail() {
  try {
    console.log('📧 Enviando email de welcome com template atualizado...');
    
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

    const emailData = {
      from: {
        email: "noreply@test-q3enl6kv8v14kj50.mlsender.net",
        name: "Coinage System"
      },
      to: [
        {
          email: "juansilveira@gmail.com",
          name: "Juan"
        }
      ],
      subject: "Bem-vindo ao Coinage - Conta Criada com Sucesso",
      html: htmlTemplate,
      text: `Bem-vindo ao Coinage!

Olá Juan,

Sua conta foi criada com sucesso e está pronta para uso.

Funcionalidades disponíveis:
• Transações PIX - Depósitos e saques via PIX
• Segurança - Autenticação de dois fatores
• Dashboard - Acompanhe suas transações

Próximos passos:
1. Complete seu perfil
2. Configure a autenticação de dois fatores
3. Explore o dashboard

Acesse: http://localhost:3000/dashboard

Precisa de ajuda? Entre em contato: suporte@coinage.app

Sistema Coinage - ${new Date().toLocaleString('pt-BR')}`
    };

    const response = await axios.post('https://api.mailersend.com/v1/email', emailData, {
      headers: {
        'Authorization': 'Bearer mlsn.bf95fc9be57e0fcf5d69b79c76424921cf326833726f4cd0e80368382265d3c8',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Email de welcome enviado com sucesso!');
    console.log('📧 Resposta:', response.data);
    console.log('🎯 Email enviado para: juansilveira@gmail.com');
    console.log('📋 Assunto: Bem-vindo ao Coinage - Conta Criada com Sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.response?.data || error.message);
  }
}

sendWelcomeEmail();