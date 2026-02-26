/* seed-crm.js – Dados iniciais: 50+ produtos, 20+ clientes */
'use strict';

const CRM_SEED = {
  clientes: [
    { id:'cli-001', nome:'Ana Paula Ferreira',     telefone:'(11) 98765-4321', email:'ana.paula@email.com',    cidade:'São Paulo',     estado:'SP', categoria:'VIP',    totalCompras:8420.00, ultimaCompra:'2024-11-15', dataCadastro:'2023-03-10', obs:'Cliente fiel, prefere PIX.' },
    { id:'cli-002', nome:'Carlos Eduardo Lima',    telefone:'(21) 97654-3210', email:'carlos.lima@email.com',   cidade:'Rio de Janeiro',estado:'RJ', categoria:'VIP',    totalCompras:6750.50, ultimaCompra:'2024-12-01', dataCadastro:'2023-05-22', obs:'Compra mobiliário frequentemente.' },
    { id:'cli-003', nome:'Márcia dos Santos',      telefone:'(31) 96543-2109', email:'marcia.santos@email.com', cidade:'Belo Horizonte',estado:'MG', categoria:'Regular', totalCompras:2300.00, ultimaCompra:'2024-10-20', dataCadastro:'2023-07-14', obs:'' },
    { id:'cli-004', nome:'Roberto Alves Costa',    telefone:'(41) 95432-1098', email:'roberto.costa@email.com', cidade:'Curitiba',      estado:'PR', categoria:'Regular', totalCompras:1850.00, ultimaCompra:'2024-09-05', dataCadastro:'2023-08-30', obs:'Mora em condomínio.' },
    { id:'cli-005', nome:'Fernanda Oliveira',      telefone:'(51) 94321-0987', email:'fernanda.o@email.com',    cidade:'Porto Alegre',  estado:'RS', categoria:'VIP',    totalCompras:9100.00, ultimaCompra:'2024-12-10', dataCadastro:'2022-11-18', obs:'Reformando casa.' },
    { id:'cli-006', nome:'João Victor Souza',      telefone:'(81) 93210-9876', email:'joao.souza@email.com',    cidade:'Recife',        estado:'PE', categoria:'Novo',   totalCompras: 450.00, ultimaCompra:'2024-12-05', dataCadastro:'2024-11-01', obs:'Primeiro contato por indicação.' },
    { id:'cli-007', nome:'Patrícia Mendes',        telefone:'(71) 92109-8765', email:'patricia.m@email.com',    cidade:'Salvador',      estado:'BA', categoria:'Regular', totalCompras:3200.00, ultimaCompra:'2024-08-15', dataCadastro:'2023-02-28', obs:'' },
    { id:'cli-008', nome:'Anderson Rodrigues',     telefone:'(62) 91098-7654', email:'anderson.r@email.com',    cidade:'Goiânia',       estado:'GO', categoria:'Regular', totalCompras:1650.00, ultimaCompra:'2024-07-22', dataCadastro:'2023-10-05', obs:'' },
    { id:'cli-009', nome:'Luciana Carvalho',       telefone:'(85) 90987-6543', email:'luciana.c@email.com',     cidade:'Fortaleza',     estado:'CE', categoria:'VIP',    totalCompras:7800.00, ultimaCompra:'2024-11-28', dataCadastro:'2022-09-15', obs:'Empresária, compra para escritório.' },
    { id:'cli-010', nome:'Marcos Pereira Neto',    telefone:'(11) 89876-5432', email:'marcos.pn@email.com',     cidade:'Campinas',      estado:'SP', categoria:'Regular', totalCompras:2750.00, ultimaCompra:'2024-10-12', dataCadastro:'2023-04-20', obs:'' },
    { id:'cli-011', nome:'Juliana Castro',         telefone:'(21) 88765-4321', email:'juliana.castro@email.com',cidade:'Niterói',       estado:'RJ', categoria:'VIP',    totalCompras:5600.00, ultimaCompra:'2024-12-08', dataCadastro:'2023-01-07', obs:'Ama decoração vintage.' },
    { id:'cli-012', nome:'Felipe Barbosa',         telefone:'(31) 87654-3210', email:'felipe.barbosa@email.com',cidade:'Contagem',      estado:'MG', categoria:'Regular', totalCompras:980.00,  ultimaCompra:'2024-06-30', dataCadastro:'2024-02-14', obs:'' },
    { id:'cli-013', nome:'Tania Ribeiro',          telefone:'(41) 86543-2109', email:'tania.r@email.com',       cidade:'Londrina',      estado:'PR', categoria:'Novo',   totalCompras: 320.00, ultimaCompra:'2024-11-20', dataCadastro:'2024-10-05', obs:'Indicada pela Fernanda.' },
    { id:'cli-014', nome:'Alexandre Moura',        telefone:'(51) 85432-1098', email:'alexandre.m@email.com',   cidade:'Caxias do Sul', estado:'RS', categoria:'Regular', totalCompras:2100.00, ultimaCompra:'2024-09-18', dataCadastro:'2023-06-12', obs:'' },
    { id:'cli-015', nome:'Cristina Lopes',         telefone:'(61) 84321-0987', email:'cristina.l@email.com',    cidade:'Brasília',      estado:'DF', categoria:'VIP',    totalCompras:11200.00,ultimaCompra:'2024-12-12', dataCadastro:'2022-07-03', obs:'Melhor cliente do DF.' },
    { id:'cli-016', nome:'Diego Santos Filho',     telefone:'(91) 83210-9876', email:'diego.sf@email.com',      cidade:'Belém',         estado:'PA', categoria:'Regular', totalCompras:1400.00, ultimaCompra:'2024-08-25', dataCadastro:'2023-09-17', obs:'' },
    { id:'cli-017', nome:'Renata Figueiredo',      telefone:'(92) 82109-8765', email:'renata.f@email.com',      cidade:'Manaus',        estado:'AM', categoria:'Regular', totalCompras:1900.00, ultimaCompra:'2024-07-14', dataCadastro:'2023-11-30', obs:'' },
    { id:'cli-018', nome:'Gustavo Andrade',        telefone:'(27) 81098-7654', email:'gustavo.a@email.com',     cidade:'Vitória',       estado:'ES', categoria:'Novo',   totalCompras: 650.00, ultimaCompra:'2024-12-03', dataCadastro:'2024-09-20', obs:'Jovem, prefere Pix.' },
    { id:'cli-019', nome:'Beatriz Nascimento',     telefone:'(83) 80987-6543', email:'beatriz.n@email.com',     cidade:'João Pessoa',   estado:'PB', categoria:'Regular', totalCompras:2450.00, ultimaCompra:'2024-10-08', dataCadastro:'2023-03-25', obs:'' },
    { id:'cli-020', nome:'Henrique Medeiros',      telefone:'(48) 79876-5432', email:'henrique.m@email.com',    cidade:'Florianópolis', estado:'SC', categoria:'VIP',    totalCompras:6300.00, ultimaCompra:'2024-11-30', dataCadastro:'2022-12-01', obs:'Arquiteto, compra peças únicas.' },
    { id:'cli-021', nome:'Simone Teixeira',        telefone:'(11) 78765-4321', email:'simone.t@email.com',      cidade:'Santo André',   estado:'SP', categoria:'Regular', totalCompras:3100.00, ultimaCompra:'2024-09-22', dataCadastro:'2023-05-08', obs:'' },
    { id:'cli-022', nome:'Rafael Cunha',           telefone:'(21) 77654-3210', email:'rafael.cunha@email.com',  cidade:'São Gonçalo',   estado:'RJ', categoria:'Novo',   totalCompras: 280.00, ultimaCompra:'2024-12-01', dataCadastro:'2024-11-15', obs:'Comprou cama queen.' },
  ],

  produtos: [
    { id:'prod-001', sku:'MOV-001', nome:'Sofá 3 Lugares Cinza', categoria:'Móveis',      preco:1890.00, custo:950.00,  estoque:5,  estoqueMin:2, local:'Galpão A' },
    { id:'prod-002', sku:'MOV-002', nome:'Mesa de Jantar 6 Lugares', categoria:'Móveis',  preco:2100.00, custo:1050.00, estoque:3,  estoqueMin:1, local:'Galpão A' },
    { id:'prod-003', sku:'MOV-003', nome:'Guarda-Roupa 6 Portas', categoria:'Móveis',     preco:1650.00, custo:820.00,  estoque:7,  estoqueMin:2, local:'Galpão B' },
    { id:'prod-004', sku:'MOV-004', nome:'Rack para TV 65"', categoria:'Móveis',          preco: 680.00, custo:320.00,  estoque:10, estoqueMin:3, local:'Galpão B' },
    { id:'prod-005', sku:'MOV-005', nome:'Cama Box Casal Queen', categoria:'Móveis',      preco:1200.00, custo:600.00,  estoque:6,  estoqueMin:2, local:'Galpão A' },
    { id:'prod-006', sku:'MOV-006', nome:'Poltrona Relax Bege', categoria:'Móveis',       preco: 750.00, custo:370.00,  estoque:8,  estoqueMin:2, local:'Galpão C' },
    { id:'prod-007', sku:'MOV-007', nome:'Escrivaninha com Gavetas', categoria:'Móveis',  preco: 480.00, custo:230.00,  estoque:12, estoqueMin:3, local:'Galpão B' },
    { id:'prod-008', sku:'MOV-008', nome:'Armário de Cozinha 4 Portas', categoria:'Móveis', preco:1350.00, custo:680.00, estoque:4, estoqueMin:1, local:'Galpão A' },
    { id:'prod-009', sku:'MOV-009', nome:'Estante de Livros 5 Prateleiras', categoria:'Móveis', preco:420.00, custo:200.00, estoque:9, estoqueMin:2, local:'Galpão C' },
    { id:'prod-010', sku:'MOV-010', nome:'Cadeira Escritório Ergonômica', categoria:'Móveis', preco:890.00, custo:440.00, estoque:15, estoqueMin:4, local:'Galpão B' },
    { id:'prod-011', sku:'ELE-001', nome:'TV LED 55" 4K Smart', categoria:'Eletrônicos', preco:2850.00, custo:2100.00, estoque:8,  estoqueMin:2, local:'Loja' },
    { id:'prod-012', sku:'ELE-002', nome:'Notebook i5 8GB 256GB SSD', categoria:'Eletrônicos', preco:2400.00, custo:1800.00, estoque:5, estoqueMin:1, local:'Loja' },
    { id:'prod-013', sku:'ELE-003', nome:'Ar Condicionado Split 12000 BTU', categoria:'Eletrônicos', preco:1850.00, custo:1400.00, estoque:6, estoqueMin:2, local:'Galpão A' },
    { id:'prod-014', sku:'ELE-004', nome:'Geladeira Frost Free 400L', categoria:'Eletrônicos', preco:2950.00, custo:2300.00, estoque:3, estoqueMin:1, local:'Galpão A' },
    { id:'prod-015', sku:'ELE-005', nome:'Máquina de Lavar 11kg', categoria:'Eletrônicos', preco:1650.00, custo:1250.00, estoque:4, estoqueMin:1, local:'Galpão A' },
    { id:'prod-016', sku:'ELE-006', nome:'Micro-ondas 30L', categoria:'Eletrônicos',    preco: 450.00, custo:320.00,  estoque:10, estoqueMin:3, local:'Loja' },
    { id:'prod-017', sku:'ELE-007', nome:'Liquidificador 1200W', categoria:'Eletrônicos',preco: 180.00, custo:110.00,  estoque:20, estoqueMin:5, local:'Loja' },
    { id:'prod-018', sku:'ELE-008', nome:'Aspirador de Pó Robô', categoria:'Eletrônicos',preco: 950.00, custo:680.00,  estoque:7,  estoqueMin:2, local:'Loja' },
    { id:'prod-019', sku:'ELE-009', nome:'Fritadeira Air Fryer 4L', categoria:'Eletrônicos', preco:390.00, custo:260.00, estoque:12, estoqueMin:3, local:'Loja' },
    { id:'prod-020', sku:'ELE-010', nome:'Cafeteira Espresso Automática', categoria:'Eletrônicos', preco:680.00, custo:450.00, estoque:8, estoqueMin:2, local:'Loja' },
    { id:'prod-021', sku:'DEC-001', nome:'Luminária de Piso Tripé', categoria:'Decoração', preco:320.00, custo:150.00, estoque:6,  estoqueMin:2, local:'Galpão C' },
    { id:'prod-022', sku:'DEC-002', nome:'Quadro Decorativo 80x60cm', categoria:'Decoração', preco:180.00, custo:75.00, estoque:15, estoqueMin:4, local:'Galpão C' },
    { id:'prod-023', sku:'DEC-003', nome:'Espelho Bisotê Oval 60x90', categoria:'Decoração', preco:280.00, custo:130.00, estoque:8, estoqueMin:2, local:'Galpão C' },
    { id:'prod-024', sku:'DEC-004', nome:'Vaso Cerâmica Grande Branco', categoria:'Decoração', preco:150.00, custo:60.00, estoque:12, estoqueMin:3, local:'Galpão C' },
    { id:'prod-025', sku:'DEC-005', nome:'Tapete Sala 2x3m Cinza', categoria:'Decoração', preco:420.00, custo:190.00, estoque:5,  estoqueMin:1, local:'Galpão B' },
    { id:'prod-026', sku:'DEC-006', nome:'Persiana Rolô Blackout', categoria:'Decoração', preco:250.00, custo:110.00, estoque:20, estoqueMin:5, local:'Galpão B' },
    { id:'prod-027', sku:'DEC-007', nome:'Almofada Decorativa Kit 4 Peças', categoria:'Decoração', preco:120.00, custo:48.00, estoque:25, estoqueMin:6, local:'Galpão C' },
    { id:'prod-028', sku:'DEC-008', nome:'Relógio de Parede 40cm', categoria:'Decoração', preco:95.00,  custo:38.00,  estoque:18, estoqueMin:4, local:'Loja' },
    { id:'prod-029', sku:'DEC-009', nome:'Porta Retrato Digital Wifi 10"', categoria:'Decoração', preco:280.00, custo:180.00, estoque:9, estoqueMin:2, local:'Loja' },
    { id:'prod-030', sku:'DEC-010', nome:'Planta Artificial Árvore 1,5m', categoria:'Decoração', preco:190.00, custo:80.00, estoque:7, estoqueMin:2, local:'Galpão C' },
    { id:'prod-031', sku:'BAN-001', nome:'Conjunto Banheiro 3 Peças', categoria:'Banheiro', preco:380.00, custo:160.00, estoque:10, estoqueMin:3, local:'Galpão B' },
    { id:'prod-032', sku:'BAN-002', nome:'Box de Vidro Temperado', categoria:'Banheiro',   preco:680.00, custo:350.00, estoque:5,  estoqueMin:1, local:'Galpão A' },
    { id:'prod-033', sku:'BAN-003', nome:'Torneira Mixer Banheiro Preto', categoria:'Banheiro', preco:220.00, custo:95.00, estoque:8, estoqueMin:2, local:'Loja' },
    { id:'prod-034', sku:'BAN-004', nome:'Toalha de Banho Egípcia 700g', categoria:'Banheiro', preco:85.00, custo:32.00, estoque:30, estoqueMin:8, local:'Loja' },
    { id:'prod-035', sku:'BAN-005', nome:'Acessórios Banheiro Inox Kit 5', categoria:'Banheiro', preco:290.00, custo:120.00, estoque:12, estoqueMin:3, local:'Loja' },
    { id:'prod-036', sku:'COZ-001', nome:'Panela de Pressão 7L', categoria:'Cozinha',     preco:180.00, custo:85.00,  estoque:14, estoqueMin:4, local:'Loja' },
    { id:'prod-037', sku:'COZ-002', nome:'Jogo de Panelas 5 Peças Cerâmica', categoria:'Cozinha', preco:320.00, custo:145.00, estoque:10, estoqueMin:3, local:'Loja' },
    { id:'prod-038', sku:'COZ-003', nome:'Mixer de Mão 600W', categoria:'Cozinha',        preco:145.00, custo:68.00,  estoque:16, estoqueMin:4, local:'Loja' },
    { id:'prod-039', sku:'COZ-004', nome:'Tábua de Corte Bambu Grande', categoria:'Cozinha', preco:65.00, custo:22.00, estoque:25, estoqueMin:6, local:'Loja' },
    { id:'prod-040', sku:'COZ-005', nome:'Facas Profissionais Kit 6', categoria:'Cozinha', preco:280.00, custo:115.00, estoque:8,  estoqueMin:2, local:'Loja' },
    { id:'prod-041', sku:'INF-001', nome:'Berço Grade Reversível', categoria:'Infantil',   preco:580.00, custo:280.00, estoque:4,  estoqueMin:1, local:'Galpão B' },
    { id:'prod-042', sku:'INF-002', nome:'Carrinho de Bebê Reversível', categoria:'Infantil', preco:750.00, custo:380.00, estoque:3, estoqueMin:1, local:'Galpão A' },
    { id:'prod-043', sku:'INF-003', nome:'Cadeirão Alimentação Multifase', categoria:'Infantil', preco:420.00, custo:200.00, estoque:6, estoqueMin:2, local:'Galpão B' },
    { id:'prod-044', sku:'INF-004', nome:'Tapete de Atividades Grande', categoria:'Infantil', preco:180.00, custo:78.00, estoque:10, estoqueMin:3, local:'Loja' },
    { id:'prod-045', sku:'INF-005', nome:'Monitor de Bebê Wi-Fi', categoria:'Infantil',   preco:320.00, custo:200.00, estoque:7,  estoqueMin:2, local:'Loja' },
    { id:'prod-046', sku:'JAR-001', nome:'Mangueira Retrátil 15m', categoria:'Jardim',    preco:120.00, custo:48.00,  estoque:20, estoqueMin:5, local:'Galpão C' },
    { id:'prod-047', sku:'JAR-002', nome:'Kit Ferramentas Jardim 5 Peças', categoria:'Jardim', preco:180.00, custo:72.00, estoque:12, estoqueMin:3, local:'Galpão C' },
    { id:'prod-048', sku:'JAR-003', nome:'Suporte de Vasos Torre 5 Níveis', categoria:'Jardim', preco:145.00, custo:58.00, estoque:9, estoqueMin:2, local:'Galpão C' },
    { id:'prod-049', sku:'FIT-001', nome:'Esteira Elétrica Dobrável', categoria:'Fitness', preco:1850.00, custo:1200.00, estoque:3, estoqueMin:1, local:'Galpão A' },
    { id:'prod-050', sku:'FIT-002', nome:'Bicicleta Ergométrica Digital', categoria:'Fitness', preco:980.00, custo:620.00, estoque:4, estoqueMin:1, local:'Galpão A' },
    { id:'prod-051', sku:'FIT-003', nome:'Halteres Ajustáveis 2-20kg Par', categoria:'Fitness', preco:380.00, custo:185.00, estoque:8, estoqueMin:2, local:'Galpão A' },
    { id:'prod-052', sku:'FIT-004', nome:'Tapete de Yoga Antiderrapante', categoria:'Fitness', preco:95.00, custo:35.00, estoque:20, estoqueMin:5, local:'Loja' },
    { id:'prod-053', sku:'ILU-001', nome:'Lustre Pendente Industrial', categoria:'Iluminação', preco:280.00, custo:120.00, estoque:8, estoqueMin:2, local:'Galpão C' },
    { id:'prod-054', sku:'ILU-002', nome:'Fita LED RGB 5m Controlada', categoria:'Iluminação', preco:120.00, custo:48.00, estoque:25, estoqueMin:6, local:'Loja' },
    { id:'prod-055', sku:'ILU-003', nome:'Spot LED Embutir 7W Kit 10', categoria:'Iluminação', preco:180.00, custo:72.00, estoque:15, estoqueMin:4, local:'Loja' },
  ]
};

/* Injeta dados de exemplo no localStorage se ainda não existir */
function seedCRMIfEmpty() {
  const CLIENTES_KEY  = 'crm_clientes';
  const PRODUTOS_KEY  = 'crm_produtos_pdv';

  if (!localStorage.getItem(CLIENTES_KEY)) {
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(CRM_SEED.clientes));
  }
  if (!localStorage.getItem(PRODUTOS_KEY)) {
    localStorage.setItem(PRODUTOS_KEY, JSON.stringify(CRM_SEED.produtos));
  }
}
