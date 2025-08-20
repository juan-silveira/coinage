const axios = require('axios');

async function testMailerSend() {
  try {
    console.log('🧪 Testando MailerSend...');
    
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
      subject: "✅ Teste MailerSend - Coinage System Funcionando!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #374151 0%, #1f2937 50%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="color: white; font-size: 20px; font-weight: 700;">🏦 Coinage</div>
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 5px;">POWERED BY MAILERSEND</div>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h1 style="color: #059669; text-align: center; margin-bottom: 30px;">✅ MailerSend Configurado!</h1>
            
            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
              <h3 style="color: #065f46; margin-bottom: 10px;">Sistema Funcionando!</h3>
              <p style="color: #047857; margin: 0;">O MailerSend foi configurado com sucesso no ambiente de desenvolvimento/testnet.</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px;">
              <h3 style="color: #374151; text-align: center; margin-bottom: 20px;">📋 Status da Configuração</h3>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #64748b;">Provider:</strong> 
                <span style="color: #059669; font-weight: 600;">MailerSend ✅</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #64748b;">Environment:</strong> 
                <span style="color: #1e293b; font-weight: 600;">Development/Testnet</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #64748b;">Templates:</strong> 
                <span style="color: #059669; font-weight: 600;">Design Minimalista ✨</span>
              </div>
              
              <div>
                <strong style="color: #64748b;">Blockchain:</strong> 
                <span style="color: #1e293b; font-weight: 600;">Azore Testnet</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/dashboard" style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                Acessar Dashboard
              </a>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                🚀 <strong>Próximo passo:</strong> Sistema pronto para executar testes completos de funcionalidades!
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: rgba(0,0,0,0.05); padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <div style="color: #6b7280; font-size: 13px;">
              Sistema Coinage - Teste realizado em ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      `,
      text: `Coinage - MailerSend Configurado!

✅ Parabéns! O MailerSend está configurado e funcionando corretamente no sistema Coinage.

Status da Configuração:
- Provider: MailerSend ✅
- Environment: Development/Testnet
- Templates: Design Minimalista ✨
- Blockchain: Azore Testnet

🚀 Próximo passo: Sistema pronto para executar testes completos de funcionalidades!

Acesse: http://localhost:3000/dashboard

Sistema Coinage - Teste realizado em ${new Date().toLocaleString('pt-BR')}`
    };

    const response = await axios.post('https://api.mailersend.com/v1/email', emailData, {
      headers: {
        'Authorization': 'Bearer mlsn.bf95fc9be57e0fcf5d69b79c76424921cf326833726f4cd0e80368382265d3c8',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Resposta:', response.data);
    console.log('🎯 Email enviado para: juansilveira@gmail.com');
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.response?.data || error.message);
  }
}

testMailerSend();