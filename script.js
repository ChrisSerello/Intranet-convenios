// === COLOQUE SUAS CHAVES DO SUPABASE AQUI ===
const SUPABASE_URL = 'https://csxoqhmypqqnaanlxfxo.supabase.co'; // JÁ PREENCHIDO
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeG9xaG15cHFxbmFhbmx4ZnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDA4NjQsImV4cCI6MjA3NzY3Njg2NH0.9k9MUOLFfA-QOENMemdB1RhVE6fM-HAeYthuDdzX_II'; // COLE SUA CHAVE AQUI
// ============================================

// === VARIÁVEIS GLOBAIS ===
let dadosPrefeituras = [];
let currentStatusFilter = "todos"; 

// --- Pegar os Elementos da Página (DOM) ---
const modal = document.getElementById("infoModal");
const modalCityName = document.getElementById("modal-city-name");
const modalProductList = document.getElementById("modal-product-list");
const closeBtn = document.querySelector(".close-btn");
const gridContainer = document.getElementById("city-grid");
const searchBar = document.getElementById("search-bar");
const noResultsMsg = document.getElementById("no-results");
const filterContainer = document.getElementById("filter-container");

// === FUNÇÕES ===

/**
 * Abre o modal com os detalhes do convênio e cria os botões de "Copiar".
 */
function abrirModal(cidade, produtos) {
    modalCityName.textContent = cidade;
    modalProductList.innerHTML = ""; 

    if (produtos.length === 0) {
        modalProductList.innerHTML = "<li>Nenhum produto cadastrado para este convênio.</li>";
    } else {
        produtos.forEach(product => {
            const li = document.createElement("li");
            const textToCopy = `${product.nome}: ${product.taxa}`;
            
            const infoDiv = document.createElement("div");
            infoDiv.className = "product-info";
            infoDiv.innerHTML = `<span class="product-name">${product.nome}</span>`;

            const detailsDiv = document.createElement("div");
            detailsDiv.className = "product-details";
            
            const percentSpan = document.createElement("span");
            percentSpan.className = "product-percent";
            percentSpan.textContent = product.taxa;

            const copyBtn = document.createElement("button");
            copyBtn.className = "copy-btn";
            copyBtn.textContent = "Copiar";

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyBtn.textContent = "Copiado!";
                    copyBtn.classList.add("copied");
                    setTimeout(() => {
                        copyBtn.textContent = "Copiar";
                        copyBtn.classList.remove("copied");
                    }, 2000);
                }).catch(err => {
                    console.error('Falha ao copiar:', err);
                    copyBtn.textContent = "Erro!";
                    setTimeout(() => {
                        copyBtn.textContent = "Copiar";
                    }, 2000);
                });
            });

            detailsDiv.appendChild(percentSpan);
            // **** A CORREÇÃO ESTÁ AQUI ****
            detailsDiv.appendChild(copyBtn); // Estava 'detailsDeta'
            // *****************************
            li.appendChild(infoDiv);
            li.appendChild(detailsDiv);
            
            modalProductList.appendChild(li);
        });
    }
    
    modal.style.display = "block";
}

/**
 * Fecha o modal.
 */
function fecharModal() {
    modal.style.display = "none";
}

/**
 * Renderiza os cards na tela com base em uma lista filtrada.
 */
function renderizarCards(listaDePrefeituras) {
    gridContainer.innerHTML = ""; 

    const prefeiturasOrdenadas = listaDePrefeituras.sort((a, b) => 
        a.cidade.localeCompare(b.cidade)
    );

    if (prefeiturasOrdenadas.length === 0) {
        noResultsMsg.style.display = "block";
    } else {
        noResultsMsg.style.display = "none";
    }

    prefeiturasOrdenadas.forEach(prefeitura => {
        const card = document.createElement("div");
        const isAtivo = prefeitura.status === "Ativo";
        const statusClass = isAtivo ? "status-ativo" : "status-inativo";
        const cardStatusClass = isAtivo ? "ativo" : "inativo";

        card.className = `card ${cardStatusClass}`;
        card.setAttribute("data-search-term", `${prefeitura.cidade} ${prefeitura.localizacao}`.toLowerCase());

        card.innerHTML = `
            <div class="card-header">
                <h3>${prefeitura.cidade}</h3>
                <span class="status-badge ${statusClass}">${prefeitura.status}</span>
            </div>
            <p>${prefeitura.localizacao}</p>
        `;

        if (isAtivo) {
            card.addEventListener("click", () => {
                abrirModal(prefeitura.cidade, prefeitura.produtos);
            });
        }
        
        gridContainer.appendChild(card);
    });
}

/**
 * Função central que aplica TODOS os filtros (busca e status) e chama a renderização.
 */
function aplicarFiltrosEBusca() {
    const searchTerm = searchBar.value.toLowerCase().trim();
    let listaFiltrada = dadosPrefeituras;

    if (currentStatusFilter !== "todos") {
        listaFiltrada = listaFiltrada.filter(pref => pref.status === currentStatusFilter);
    }

    if (searchTerm) {
        listaFiltrada = listaFiltrada.filter(pref => {
            const cardText = `${pref.cidade} ${prefeitura.localizacao}`.toLowerCase();
            return cardText.includes(searchTerm);
        });
    }

    renderizarCards(listaFiltrada);
}


// === EVENT LISTENERS (Onde a mágica acontece) ===

// 1. Ponto de Entrada: Carregar Dados da API (MODIFICADO PARA SUPABASE)
document.addEventListener("DOMContentLoaded", () => {
    
    // Verifica se as chaves foram preenchidas
    if (!SUPABASE_URL.includes('https') || !SUPABASE_KEY.startsWith('ey')) {
         gridContainer.innerHTML = `<p style='color: #FF5555; text-align: center; grid-column: 1 / -1;'>
                <strong>Erro de Configuração!</strong><br>
                As variáveis SUPABASE_URL ou SUPABASE_KEY não foram preenchidas corretamente no topo do arquivo script.js.
            </p>`;
        return; 
    }

    // Este fetch busca todas as prefeituras E seus produtos relacionados de uma só vez
    fetch(`${SUPABASE_URL}/rest/v1/Prefeituras?select=*,Produtos(*)`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.statusText}`);
        }
        return response.json();
    })
    .then(dadosRecebidos => {
        
        const dadosFormatados = dadosRecebidos.map(pref => ({
            ...pref,
            produtos: pref.Produtos // Renomeia "Produtos" (maiúsculo) para "produtos" (minúsculo)
        }));

        dadosPrefeituras = dadosFormatados; 
        aplicarFiltrosEBusca(); 
    })
    .catch(error => {
        console.error('Erro ao buscar dados da API:', error);
        gridContainer.innerHTML = `<p style='color: #FF5555; text-align: center; grid-column: 1 / -1;'>
            <strong>Falha ao carregar convênios.</strong><br>
            Verifique a conexão ou as chaves da API no script.js.
        </p>`;
    });
});

// 2. Listeners do Modal
closeBtn.addEventListener("click", fecharModal);
window.addEventListener("click", (event) => {
    if (event.target == modal) {
        fecharModal();
    }
});

// 3. Listener da Barra de Busca
searchBar.addEventListener("keyup", aplicarFiltrosEBusca);

// 4. Listeners dos Botões de Filtro
filterContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("filter-btn")) {
        filterContainer.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        event.target.classList.add("active");
        currentStatusFilter = event.target.dataset.filter;
        aplicarFiltrosEBusca();
    }
});