import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("ERRO: GEMINI_API_KEY não foi encontrada no process.env");
} else {
  console.log("Variável GEMINI_API_KEY encontrada!");
  console.log(`Comprimento da chave: ${apiKey.length} caracteres`);
  console.log(`Início: ${apiKey.substring(0, 4)}...`);
  console.log(`Fim: ...${apiKey.substring(apiKey.length - 4)}`);
  
  if (apiKey.includes('"') || apiKey.includes("'")) {
    console.log("AVISO: Sua chave no .env contém aspas. Remova-as para evitar erros de autenticação.");
  }
  if (apiKey.trim() !== apiKey) {
    console.log("AVISO: Sua chave contém espaços em branco no início ou no fim. Remova-os.");
  }
}
