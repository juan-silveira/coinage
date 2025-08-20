@php
    use App\Services\FeeService;
    use App\Enum\BalanceTypeEnum;
    use App\Enum\TransactionTypeEnum;
    use App\Models\Transaction;
    use Carbon\Carbon;

    // Pega os parâmetros da Sessão Flash. Se não existirem, usa um array vazio como padrão.
    $params = session('preselection_params', []);

    // Usa os dados da sessão, com um fallback (??) para os valores padrão.
    $activeTab = $params['tab'] ?? 'buy';
    $preselection = [
        'buy_pay' => $params['buy_pay'] ?? null,
        'buy_receive' => $params['buy_receive'] ?? null,
        'sell_pay' => $params['sell_pay'] ?? null,
        'sell_receive' => $params['sell_receive'] ?? null,
    ];

    // Arrays de moedas para diferentes dropdowns
    $fiatCurrencies = [
        ['code' => 'cBRL', 'name' => 'Coinager Real Brasileiro', 'icon' => 'BRL.png', 'balance' => 1250.75],
        ['code' => 'USD', 'name' => 'Dólar Americano', 'icon' => 'USD.png', 'balance' => 0],
    ];

    $cryptoCurrencies = [
        [
            'code' => 'CNT',
            'name' => 'Coinage Token',
            'icon' => 'CNT.png',
            'balance' => 12.00125,
            'price_brl' => 1.0,
            'price_usd' => 0.18,
        ],
        [
            'code' => 'PCN',
            'name' => 'Pratique Coin',
            'icon' => 'PCN.png',
            'balance' => 1002.451234,
            'price_brl' => 1.0,
            'price_usd' => 0.18,
        ],
        [
            'code' => 'MJD',
            'name' => 'Meu Jurídico Digital',
            'icon' => 'MJD.png',
            'balance' => 100.0,
            'price_brl' => 15.0,
            'price_usd' => 2.7,
        ],
        [
            'code' => 'IMB',
            'name' => 'Imobiliária',
            'icon' => 'IMB.png',
            'balance' => 111.0,
            'price_brl' => 10.0,
            'price_usd' => 1.8,
        ],
    ];

    $paymentMethods = [
        ['code' => 'PIX', 'name' => 'Transferência Bancária (PIX)', 'icon' => 'pix'],
        ['code' => 'BRL', 'name' => 'BRL Saldo', 'icon' => 'BRL.png', 'balance' => 1250.75],
        ['code' => 'USD', 'name' => 'USD Saldo', 'icon' => 'USD.png', 'balance' => 0],
    ];

    // Configuração de taxas
    $feeConfig = [
        'buy' => ['percentage' => 1, 'fixed' => 0],
        'sell' => ['percentage' => 3.5, 'fixed' => 0],
        'pix' => ['percentage' => 0.5, 'fixed' => 0],
    ];
@endphp

@extends('layouts.app')

@section('content_header')
    <!-- Breadcrumb ============================================= -->
    <div class="fs-12">
        Negociar > <b>Criptoativos</b>
    </div>
    <div class="fs-2 fw-medium mt-3 mb-4">Comprar e Vender</div>
    <!-- Breadcrumb End ============================================= -->
@endsection

@section('content')
    <style>
        #market-tabs>.nav-item>.nav-link {
            border: none !important;
            box-shadow: var(--bs-box-shadow) !important;
            background-color: var(--bg-tertiary);
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-muted) !important;
        }

        #market-tabs>.nav-item>.nav-link.active {
            background-color: var(--card-bg);
        }

        #market-tabs>.nav-item>.nav-link:hover {
            background-color: var(--bg-secondary);
            color: var(--text-primary) !important;
        }

        #market-tabs>.nav-item:first-child>.nav-link {
            border-radius: 10px 0 0 0 !important;
        }

        #market-tabs>.nav-item:last-child>.nav-link {
            border-radius: 0 10px 0 0 !important;
        }

        #market-tabs>.nav-item:first-child>.nav-link.active {
            color: var(--bs-primary) !important;
        }

        #market-tabs>.nav-item:last-child>.nav-link.active {
            color: var(--bs-danger) !important;
        }

        .tab-content>.tab-pane>.position-relative.bg-white {
            border-radius: 0 10px 10px 10px !important;
            max-width: 450px;
        }
    </style>
    <div class="d-flex justify-content-center">
        <div class="">
            <ul class="nav" id="market-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link {{ $activeTab === 'buy' ? 'active' : '' }}" id="buy-tab" data-bs-toggle="tab"
                        data-bs-target="#buy-tab-pane" type="button" role="tab" aria-controls="buy-tab-pane"
                        aria-selected="{{ $activeTab === 'buy' ? 'true' : 'false' }}">Comprar</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link {{ $activeTab === 'sell' ? 'active' : '' }}" id="sell-tab" data-bs-toggle="tab"
                        data-bs-target="#sell-tab-pane" type="button" role="tab" aria-controls="sell-tab-pane"
                        aria-selected="{{ $activeTab === 'sell' ? 'true' : 'false' }}">Vender</button>
                </li>
            </ul>
            <div class="tab-content" id="market-tabs-content">
                <!-- Tooltip personalizado -->
                <div id="custom_tooltip" class="position-absolute bg-dark text-white p-3 rounded shadow-lg d-none"
                    style="z-index: 100; max-width: 300px; font-size: 12px;">
                    <div class="tooltip-content">
                        <div class="fw-bold text-center mb-2">Informações da Cotação</div>
                        <hr class="my-2 border-secondary">
                        <div class="mb-1 d-flex justify-content-between"><strong>Price:</strong> 1 USDC = 5.62863944 BRL
                        </div>
                        <div class="mb-1 d-flex justify-content-between"><strong>Gastar:</strong> 1000 BRL = 177.66262708
                            USDC</div>
                        <div class="mb-1 d-flex justify-content-between"><strong>Taxa:</strong> 1.9 BRL = 0.33765937 USDC
                        </div>
                        <div class="mb-2 d-flex justify-content-between"><strong>Receber:</strong> 177.3252685 USDC</div>
                        <hr class="my-2 border-secondary">
                        <div class="text-muted">
                            <small><strong>Observação:</strong> os preços das criptomoedas podem variar de acordo com as
                                condições do mercado. Consulte o preço final na página de confirmação da ordem.</small>
                        </div>
                    </div>
                    <div class="tooltip-arrow"></div>
                </div>
                <div class="tab-pane fade {{ $activeTab === 'buy' ? 'show active' : '' }}" id="buy-tab-pane" role="tabpanel"
                    aria-labelledby="buy-tab" tabindex="0">
                    <div class="position-relative bg-white shadow-sm rounded">
                        <div class="fs-6 fw-semibold text-center text-primary mb-3 border-bottom border-primary py-3">
                            COMPRAR</div>
                        <div class="p-4 pb-2">
                            <div class="border rounded px-4 py-0">
                                <label class="mt-3" for="price">Pagar</label>
                                <div class="d-flex justify-content-between position-relative" id="buy_pay_selector">
                                    <input type="text" class="form-control border-0 p-0 fs-5 no-focus-border"
                                        placeholder="25 - 55,770" id="buy_pay_input">
                                    <button class="btn btn-link d-flex align-items-center pe-0 text-decoration-none"
                                        id="buy_pay_btn">
                                        <img src="{{ asset('images/currencies/' . $fiatCurrencies[0]['icon']) }}"
                                            alt="{{ $fiatCurrencies[0]['code'] }}" width="20">
                                        <span class="mx-1">{{ $fiatCurrencies[0]['code'] }}</span>
                                        <i class="bi bi-chevron-down"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border" id="buy_pay_container"
                            style="z-index: 10;">
                            <ul class="list-unstyled m-0">
                                @foreach ($fiatCurrencies as $fiat)
                                    <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center"
                                        data-currency="{{ $fiat['code'] }}">
                                        <img src="{{ asset('images/currencies/' . $fiat['icon']) }}"
                                            alt="{{ $fiat['code'] }}" width="20">
                                        <div class="d-flex flex-column justify-content-center">
                                            <span class="ms-2 lh-1">{{ $fiat['code'] }}</span>
                                            <span class="ms-2 mt-1 fs-10 lh-1">{{ $fiat['name'] }}</span>
                                        </div>
                                    </li>
                                @endforeach
                            </ul>
                        </div>

                        <div class="p-2 px-4" id>
                            <div class="border rounded px-4 py-0">
                                <label class="mt-3 d-flex align-items-center" for="price">
                                    Receber
                                    <i class="bi-chat-left-dots ms-2 text-muted d-none position-relative"
                                        id="buy_receive_tooltip_trigger"></i>
                                </label>
                                <div class="d-flex justify-content-between position-relative" id="buy_receive_selector">
                                    <input type="text" class="form-control border-0 p-0 fs-5 no-focus-border"
                                        placeholder="25 - 55,770" id="buy_receive_input">
                                    <button class="btn btn-link d-flex align-items-center pe-0 text-decoration-none"
                                        id="buy_receive_btn">
                                        <img src="{{ asset('images/currencies/' . $cryptoCurrencies[0]['icon']) }}"
                                            alt="{{ $cryptoCurrencies[0]['code'] }}" width="20">
                                        <span class="mx-1">{{ $cryptoCurrencies[0]['code'] }}</span>
                                        <i class="bi bi-chevron-down"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border"
                            id="buy_receive_container" style="z-index: 10;">
                            <ul class="list-unstyled m-0">
                                @foreach ($cryptoCurrencies as $crypto)
                                    <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center"
                                        data-currency="{{ $crypto['code'] }}">
                                        <img src="{{ asset('images/currencies/' . $crypto['icon']) }}"
                                            alt="{{ $crypto['code'] }}" width="20">
                                        <div class="d-flex flex-column justify-content-center">
                                            <span class="ms-2 lh-1">{{ $crypto['code'] }}</span>
                                            <span class="ms-2 mt-1 fs-10 lh-1">{{ $crypto['name'] }}</span>
                                        </div>
                                    </li>
                                @endforeach
                            </ul>
                        </div>

                        <div class="mt-2 px-4 mb-4">
                            <label class="" for="price">Método de pagamento</label>
                            <div class="border rounded">
                                <button id="buy_payment_method_btn"
                                    class="btn btn-link d-flex justify-content-between align-items-center p-4 text-decoration-none w-100">
                                    <div class="d-flex align-items-center">
                                        <svg class="" xmlns="http://www.w3.org/2000/svg" width="20"
                                            viewBox="0 0 24 24">
                                            <path fill="#3cbeac"
                                                d="m15.45 16.52l-3.01-3.01c-.11-.11-.24-.13-.31-.13s-.2.02-.31.13L8.8 16.53c-.34.34-.87.89-2.64.89l3.71 3.7a3 3 0 0 0 4.24 0l3.72-3.71c-.91 0-1.67-.18-2.38-.89M8.8 7.47l3.02 3.02c.08.08.2.13.31.13s.23-.05.31-.13l2.99-2.99c.71-.74 1.52-.91 2.43-.91l-3.72-3.71a3 3 0 0 0-4.24 0l-3.71 3.7c1.76 0 2.3.58 2.61.89" />
                                            <path fill="#3cbeac"
                                                d="m21.11 9.85l-2.25-2.26H17.6c-.54 0-1.08.22-1.45.61l-3 3c-.28.28-.65.42-1.02.42a1.5 1.5 0 0 1-1.02-.42L8.09 8.17c-.38-.38-.9-.6-1.45-.6H5.17l-2.29 2.3a3 3 0 0 0 0 4.24l2.29 2.3h1.48c.54 0 1.06-.22 1.45-.6l3.02-3.02c.28-.28.65-.42 1.02-.42s.74.14 1.02.42l3.01 3.01c.38.38.9.6 1.45.6h1.26l2.25-2.26a3.042 3.042 0 0 0-.02-4.29" />
                                        </svg>
                                        <span class="mx-1">Transferência Bancária (PIX)</span>
                                    </div>
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                            <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border"
                                id="buy_payment_method_container" style="z-index: 10;">
                                <ul class="list-unstyled m-0">
                                    @foreach ($paymentMethods as $method)
                                        <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center justify-content-between"
                                            data-method="{{ $method['code'] }}">
                                            <div class="d-flex align-items-center">
                                                @if ($method['icon'] == 'pix')
                                                    <svg class="" xmlns="http://www.w3.org/2000/svg" width="20"
                                                        viewBox="0 0 24 24">
                                                        <path fill="#3cbeac"
                                                            d="m15.45 16.52l-3.01-3.01c-.11-.11-.24-.13-.31-.13s-.2.02-.31.13L8.8 16.53c-.34.34-.87.89-2.64.89l3.71 3.7a3 3 0 0 0 4.24 0l3.72-3.71c-.91 0-1.67-.18-2.38-.89M8.8 7.47l3.02 3.02c.08.08.2.13.31.13s.23-.05.31-.13l2.99-2.99c.71-.74 1.52-.91 2.43-.91l-3.72-3.71a3 3 0 0 0-4.24 0l-3.71 3.7c1.76 0 2.3.58 2.61.89" />
                                                        <path fill="#3cbeac"
                                                            d="m21.11 9.85l-2.25-2.26H17.6c-.54 0-1.08.22-1.45.61l-3 3c-.28.28-.65.42-1.02.42a1.5 1.5 0 0 1-1.02-.42L8.09 8.17c-.38-.38-.9-.6-1.45-.6H5.17l-2.29 2.3a3 3 0 0 0 0 4.24l2.29 2.3h1.48c.54 0 1.06-.22 1.45-.6l3.02-3.02c.28-.28.65-.42 1.02-.42s.74.14 1.02.42l3.01 3.01c.38.38.9.6 1.45.6h1.26l2.25-2.26a3.042 3.042 0 0 0-.02-4.29" />
                                                    </svg>
                                                @else
                                                    <img src="{{ asset('images/currencies/' . $method['icon']) }}"
                                                        alt="{{ $method['code'] }}" width="20">
                                                @endif
                                                <div class="d-flex flex-column justify-content-center">
                                                    <span class="ms-2 lh-1">{{ $method['name'] }}</span>
                                                </div>
                                            </div>
                                            @if (isset($method['balance']))
                                                <div class="text-end fs-10">
                                                    <span class="">{{ number_format($method['balance'], 6) }}</span>
                                                    <span class="ms-1">{{ $method['code'] }}</span>
                                                </div>
                                            @endif
                                        </li>
                                    @endforeach
                                </ul>
                            </div>
                        </div>

                        <div class="px-4 pb-4">
                            <button class="btn btn-primary w-100" id="buy_submit_btn">Comprar CNT</button>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade {{ $activeTab === 'sell' ? 'show active' : '' }}" id="sell-tab-pane"
                    role="tabpanel" aria-labelledby="sell-tab" tabindex="0">
                    <div class="position-relative bg-white shadow-sm rounded">
                        <div class="fs-6 fw-semibold text-center text-danger mb-3 border-bottom border-danger py-3">VENDER
                        </div>
                        <div class="p-4 pb-2">
                            <div class="border rounded px-4 py-0">
                                <label class="mt-3" for="price">Pagar</label>
                                <div class="d-flex justify-content-between position-relative" id="sell_pay_selector">
                                    <input type="text" class="form-control border-0 p-0 fs-5 no-focus-border"
                                        placeholder="25 - 55,770" id="sell_pay_input">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link text-decoration-none p-0" id="sell_max_btn">
                                            <span class="text-warning">Máx</span>
                                        </button>
                                        <button
                                            class="btn btn-link d-flex align-items-center ms-2 px-0 text-decoration-none"
                                            id="sell_pay_btn">
                                            @php $cryptoWithBalance = collect($cryptoCurrencies)->firstWhere('balance', '>', 0) ?? $cryptoCurrencies[0]; @endphp
                                            <img src="{{ asset('images/currencies/' . $cryptoWithBalance['icon']) }}"
                                                alt="{{ $cryptoWithBalance['code'] }}" width="20">
                                            <span class="mx-1">{{ $cryptoWithBalance['code'] }}</span>
                                            <i class="bi bi-chevron-down"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="d-flex" style="margin-top: -15px;">
                                    <span class="fs-10 me-1 text-muted">Disponível:</span>
                                    <div class="fs-10 text-muted">
                                        <span
                                            id="sell_pay_available_balance">{{ number_format($cryptoWithBalance['balance'], 6) }}</span>
                                        <span class="ms-1"
                                            id="sell_pay_available_code">{{ $cryptoWithBalance['code'] }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border"
                            id="sell_pay_container" style="z-index: 10;">
                            <ul class="list-unstyled m-0">
                                @foreach ($cryptoCurrencies as $crypto)
                                    @if ($crypto['balance'] > 0)
                                        <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center justify-content-between"
                                            data-currency="{{ $crypto['code'] }}"
                                            data-balance="{{ $crypto['balance'] }}">
                                            <div class="d-flex align-items-center">
                                                <img src="{{ asset('images/currencies/' . $crypto['icon']) }}"
                                                    alt="{{ $crypto['code'] }}" width="20">
                                                <div class="d-flex flex-column justify-content-center">
                                                    <span class="ms-2 lh-1">{{ $crypto['code'] }}</span>
                                                    <span class="ms-2 mt-1 fs-10 lh-1">{{ $crypto['name'] }}</span>
                                                </div>
                                            </div>
                                            <div class="text-end fs-10">
                                                <span class="">{{ number_format($crypto['balance'], 6) }}</span>
                                                <span class="ms-1">{{ $crypto['code'] }}</span>
                                            </div>
                                        </li>
                                    @endif
                                @endforeach
                            </ul>
                        </div>

                        <div class="p-2 px-4" id>
                            <div class="border rounded px-4 py-0">
                                <label class="mt-3 d-flex align-items-center" for="price">
                                    Receber
                                    <i class="bi-chat-left-dots ms-2 text-muted d-none position-relative"
                                        id="sell_receive_tooltip_trigger"></i>
                                </label>
                                <div class="d-flex justify-content-between position-relative" id="sell_receive_selector">
                                    <input type="text" class="form-control border-0 p-0 fs-5 no-focus-border"
                                        placeholder="25 - 55,770" id="sell_receive_input">
                                    <button class="btn btn-link d-flex align-items-center pe-0 text-decoration-none"
                                        id="sell_receive_btn">
                                        <img src="{{ asset('images/currencies/' . $fiatCurrencies[0]['icon']) }}"
                                            alt="{{ $fiatCurrencies[0]['code'] }}" width="20">
                                        <span class="mx-1">{{ $fiatCurrencies[0]['code'] }}</span>
                                        <i class="bi bi-chevron-down"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border"
                            id="sell_receive_container" style="z-index: 10;">
                            <ul class="list-unstyled m-0">
                                @foreach ($fiatCurrencies as $fiat)
                                    <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center"
                                        data-currency="{{ $fiat['code'] }}">
                                        <img src="{{ asset('images/currencies/' . $fiat['icon']) }}"
                                            alt="{{ $fiat['code'] }}" width="20">
                                        <div class="d-flex flex-column justify-content-center">
                                            <span class="ms-2 lh-1">{{ $fiat['code'] }}</span>
                                            <span class="ms-2 mt-1 fs-10 lh-1">{{ $fiat['name'] }}</span>
                                        </div>
                                    </li>
                                @endforeach
                            </ul>
                        </div>

                        <div class="mt-2 px-4 mb-4">
                            <label class="" for="price">Método de recebimento</label>
                            <div class="border rounded">
                                <button id="sell_payment_method_btn"
                                    class="btn btn-link d-flex justify-content-between align-items-center p-4 text-decoration-none w-100">
                                    <div class="d-flex align-items-center">
                                        <svg class="" xmlns="http://www.w3.org/2000/svg" width="20"
                                            viewBox="0 0 24 24">
                                            <path fill="#3cbeac"
                                                d="m15.45 16.52l-3.01-3.01c-.11-.11-.24-.13-.31-.13s-.2.02-.31.13L8.8 16.53c-.34.34-.87.89-2.64.89l3.71 3.7a3 3 0 0 0 4.24 0l3.72-3.71c-.91 0-1.67-.18-2.38-.89M8.8 7.47l3.02 3.02c.08.08.2.13.31.13s.23-.05.31-.13l2.99-2.99c.71-.74 1.52-.91 2.43-.91l-3.72-3.71a3 3 0 0 0-4.24 0l-3.71 3.7c1.76 0 2.3.58 2.61.89" />
                                            <path fill="#3cbeac"
                                                d="m21.11 9.85l-2.25-2.26H17.6c-.54 0-1.08.22-1.45.61l-3 3c-.28.28-.65.42-1.02.42a1.5 1.5 0 0 1-1.02-.42L8.09 8.17c-.38-.38-.9-.6-1.45-.6H5.17l-2.29 2.3a3 3 0 0 0 0 4.24l2.29 2.3h1.48c.54 0 1.06-.22 1.45-.6l3.02-3.02c.28-.28.65-.42 1.02-.42s.74.14 1.02.42l3.01 3.01c.38.38.9.6 1.45.6h1.26l2.25-2.26a3.042 3.042 0 0 0-.02-4.29" />
                                        </svg>
                                        <span class="mx-1">Transferência Bancária (PIX)</span>
                                    </div>
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                            <div class="d-none position-absolute bg-white shadow-sm rounded p-2 border"
                                id="sell_payment_method_container" style="z-index: 10;">
                                <ul class="list-unstyled m-0">
                                    @foreach ($paymentMethods as $method)
                                        <li class="p-2 cursor-pointer hover-bg-light d-flex align-items-center justify-content-between"
                                            data-method="{{ $method['code'] }}">
                                            <div class="d-flex align-items-center">
                                                @if ($method['icon'] == 'pix')
                                                    <svg class="" xmlns="http://www.w3.org/2000/svg" width="20"
                                                        viewBox="0 0 24 24">
                                                        <path fill="#3cbeac"
                                                            d="m15.45 16.52l-3.01-3.01c-.11-.11-.24-.13-.31-.13s-.2.02-.31.13L8.8 16.53c-.34.34-.87.89-2.64.89l3.71 3.7a3 3 0 0 0 4.24 0l3.72-3.71c-.91 0-1.67-.18-2.38-.89M8.8 7.47l3.02 3.02c.08.08.2.13.31.13s.23-.05.31-.13l2.99-2.99c.71-.74 1.52-.91 2.43-.91l-3.72-3.71a3 3 0 0 0-4.24 0l-3.71 3.7c1.76 0 2.3.58 2.61.89" />
                                                        <path fill="#3cbeac"
                                                            d="m21.11 9.85l-2.25-2.26H17.6c-.54 0-1.08.22-1.45.61l-3 3c-.28.28-.65.42-1.02.42a1.5 1.5 0 0 1-1.02-.42L8.09 8.17c-.38-.38-.9-.6-1.45-.6H5.17l-2.29 2.3a3 3 0 0 0 0 4.24l2.29 2.3h1.48c.54 0 1.06-.22 1.45-.6l3.02-3.02c.28-.28.65-.42 1.02-.42s.74.14 1.02.42l3.01 3.01c.38.38.9.6 1.45.6h1.26l2.25-2.26a3.042 3.042 0 0 0-.02-4.29" />
                                                    </svg>
                                                @else
                                                    <img src="{{ asset('images/currencies/' . $method['icon']) }}"
                                                        alt="{{ $method['code'] }}" width="20">
                                                @endif
                                                <div class="d-flex flex-column justify-content-center">
                                                    <span class="ms-2 lh-1">{{ $method['name'] }}</span>
                                                </div>
                                            </div>
                                            @if (isset($method['balance']))
                                                <div class="text-end fs-10">
                                                    <span class="">{{ number_format($method['balance'], 6) }}</span>
                                                    <span class="ms-1">{{ $method['code'] }}</span>
                                                </div>
                                            @endif
                                        </li>
                                    @endforeach
                                </ul>
                            </div>
                        </div>

                        <div class="px-4 pb-4">
                            <button class="btn btn-danger w-100" id="sell_submit_btn">Vender CNT</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex flex-column mb-3">
        <span class="h6">Minhas Ordens</span>
        <div class="ms-3 bg-primary" style="height: 2px; width: 70px;"></div>
    </div>
    <div class="card border-0 shadow-sm bg-white">
        <div class="card-body">
            <div class="d-flex justify-content-end">
                <div class="d-flex flex-column">
                    <label class="fs-12">Status</label>
                    <div class="btn-group btn-group-xs" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" class="btn-check" name="status" id="all_status" autocomplete="off"
                            checked>
                        <label class="btn btn-outline-primary" for="all_status">Todas</label>

                        <input type="radio" class="btn-check" name="status" id="open_status" autocomplete="off">
                        <label class="btn btn-outline-primary" for="open_status">Abertas</label>
                    </div>
                </div>
                <div class="d-flex flex-column ms-3">
                    <label class="fs-12">Tipo</label>
                    <div class="btn-group btn-group-xs" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" class="btn-check" name="type" id="all_type" autocomplete="off"
                            checked>
                        <label class="btn btn-outline-primary" for="all_type">Todas</label>

                        <input type="radio" class="btn-check" name="type" id="sell_type" autocomplete="off">
                        <label class="btn btn-outline-primary" for="sell_type">Venda</label>

                        <input type="radio" class="btn-check" name="type" id="buy_type" autocomplete="off">
                        <label class="btn btn-outline-primary" for="buy_type">Compra</label>
                    </div>
                </div>
            </div>
            <div class="my-4">
                <div class="table-responsive">
                    <table id="table"></table>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
    @parent

    <script>
        // Configuração dos arrays de dados
        const currencyData = {
            fiatCurrencies: @json($fiatCurrencies),
            cryptoCurrencies: @json($cryptoCurrencies),
            paymentMethods: @json($paymentMethods),
            feeConfig: @json($feeConfig)
        };

        // Objeto com as moedas pré-selecionadas a partir da URL
        const preselection = @json($preselection);

        // --- LÓGICA DE INICIALIZAÇÃO ---
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar todos os dropdowns primeiro
            initDropdown('buy_pay', 'buy_pay_container');
            initDropdown('buy_receive', 'buy_receive_container');
            initDropdown('sell_pay', 'sell_pay_container');
            initDropdown('sell_receive', 'sell_receive_container');
            initDropdown('buy_payment_method', 'buy_payment_method_container');
            initDropdown('sell_payment_method', 'sell_payment_method_container');

            // Aplica as seleções da URL após tudo estar inicializado
            applyUrlParameters();

            // Inicializar funcionalidades específicas dos inputs e botões
            initBuyPayInput();
            initSellPayInput();
            initSellMaxButton();
        });

        // --- FUNÇÕES PRINCIPAIS (Nossas Adições) ---

        /**
         * Lê os parâmetros da URL e pré-seleciona os dropdowns corretos.
         */
        function applyUrlParameters() {
            const selections = {
                'buy_pay': {
                    btn: 'buy_pay_btn',
                    container: 'buy_pay_container'
                },
                'buy_receive': {
                    btn: 'buy_receive_btn',
                    container: 'buy_receive_container'
                },
                'sell_pay': {
                    btn: 'sell_pay_btn',
                    container: 'sell_pay_container'
                },
                'sell_receive': {
                    btn: 'sell_receive_btn',
                    container: 'sell_receive_container'
                }
            };

            for (const key in selections) {
                if (preselection[key]) {
                    const currencyCode = preselection[key];
                    const config = selections[key];
                    const btn = document.getElementById(config.btn);
                    const container = document.getElementById(config.container);

                    if (btn && container) {
                        const itemToSelect = container.querySelector(`li[data-currency="${currencyCode}"]`);
                        if (itemToSelect) {
                            selectDropdownItem(btn, itemToSelect, container);

                            // Se a moeda de venda for pré-selecionada, atualiza o saldo
                            if (key === 'sell_pay') {
                                updateSellAvailableBalance(currencyCode);
                            }
                        }
                    }
                }
            }
        }

        /**
         * Função central que atualiza a UI de um dropdown quando um item é selecionado.
         */
        function selectDropdownItem(btn, item, container) {
            const img = item.querySelector('img, svg');
            const currencyCode = item.getAttribute('data-currency') || item.getAttribute('data-method');
            const currencyNameSpan = item.querySelector('span');

            if (img && currencyCode && currencyNameSpan) {
                const btnImgContainer = btn.querySelector('div:first-child') || btn;
                let btnImg = btnImgContainer.querySelector('img, svg');
                const btnSpan = btn.querySelector('span') || btn.querySelector('div span');

                if (btnImg && btnSpan) {
                    if (img.tagName === 'svg') {
                        btnImg.outerHTML = img.outerHTML;
                    } else if (img.tagName === 'IMG') {
                        if (btnImg.tagName === 'svg') {
                            btnImg.outerHTML =
                                `<img src="${img.src}" alt="${img.alt}" width="20" class="${img.className}">`;
                        } else {
                            btnImg.src = img.src;
                            btnImg.alt = img.alt;
                        }
                    }

                    const isPaymentMethod = container.id.includes('payment_method');
                    if (isPaymentMethod) {
                        btnSpan.textContent = currencyNameSpan.textContent;
                    } else {
                        btnSpan.textContent = currencyCode;
                    }
                }
            }

            // Se o usuário alterar a moeda de venda, atualiza o saldo disponível
            if (btn.id === 'sell_pay_btn') {
                updateSellAvailableBalance(currencyCode);
            }

            updateSubmitButtonText(btn.id, currencyCode);
            container.classList.add('d-none');
            toggleChevron(btn, true);
            recalculateOnCurrencyChange(btn.id);
        }

        /**
         * Atualiza o texto "Disponível" na aba de Venda.
         */
        function updateSellAvailableBalance(currencyCode) {
            const balanceEl = document.getElementById('sell_pay_available_balance');
            const codeEl = document.getElementById('sell_pay_available_code');
            if (!balanceEl || !codeEl) return;

            const crypto = currencyData.cryptoCurrencies.find(c => c.code === currencyCode);
            if (crypto) {
                const formattedBalance = parseFloat(crypto.balance).toFixed(6);
                balanceEl.textContent = formattedBalance;
                codeEl.textContent = crypto.code;
            } else {
                balanceEl.textContent = '0.000000';
                codeEl.textContent = '---';
            }
        }

        // --- FUNÇÕES AUXILIARES (O Código Original que já existia) ---

        function initDropdown(btnId, containerId) {
            const btn = document.getElementById(btnId + '_btn');
            const container = document.getElementById(containerId);
            if (!btn || !container) return;

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeAllDropdowns(containerId);
                container.classList.toggle('d-none');
                if (!container.classList.contains('d-none')) {
                    positionDropdown(container, btn);
                }
                toggleChevron(btn, container.classList.contains('d-none'));
            });

            const items = container.querySelectorAll('li');
            items.forEach(item => {
                item.addEventListener('click', function() {
                    selectDropdownItem(btn, item, container);
                });
            });
        }

        function positionDropdown(dropdown, btn) {
            const borderDiv = btn.closest('.border');
            if (!borderDiv) return;
            const relativeParent = borderDiv.closest('.position-relative') || borderDiv.parentElement;
            if (!relativeParent) return;
            const parentRect = relativeParent.getBoundingClientRect();
            const borderRect = borderDiv.getBoundingClientRect();
            const topOffset = borderRect.bottom - parentRect.top;
            const leftOffset = borderRect.left - parentRect.left;
            dropdown.style.position = 'absolute';
            dropdown.style.top = `${topOffset}px`;
            dropdown.style.left = `${leftOffset}px`;
            dropdown.style.width = `${borderRect.width}px`;
            dropdown.style.zIndex = '10';
        }

        function toggleChevron(btn, isClosed) {
            const chevron = btn.querySelector('.bi-chevron-down, .bi-chevron-right');
            if (chevron) {
                chevron.style.transform = isClosed ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        }

        function closeAllDropdowns(exceptId) {
            const dropdowns = [
                'buy_pay_container', 'buy_receive_container', 'sell_pay_container',
                'sell_receive_container', 'buy_payment_method_container', 'sell_payment_method_container'
            ];
            dropdowns.forEach(id => {
                if (id !== exceptId) {
                    const dropdown = document.getElementById(id);
                    if (dropdown) {
                        dropdown.classList.add('d-none');
                        const btn = document.getElementById(id.replace('_container', '_btn'));
                        if (btn) toggleChevron(btn, true);
                    }
                }
            });
        }

        document.addEventListener('click', function(e) {
            const isInsideDropdown = e.target.closest('[id$="_container"]') ||
                e.target.closest('[id$="_btn"]');
            if (!isInsideDropdown) {
                closeAllDropdowns();
            }
        });

        function initBuyPayInput() {
            const input = document.getElementById('buy_pay_input');
            const receiveInput = document.getElementById('buy_receive_input');
            const tooltipTrigger = document.getElementById('buy_receive_tooltip_trigger');

            if (input && tooltipTrigger && receiveInput) {
                input.addEventListener('input', function() {
                    const value = parseFloat(this.value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    if (value > 0) {
                        tooltipTrigger.classList.remove('d-none');
                        const calculation = calculateBuyAmount(value);
                        receiveInput.value = formatNumber(calculation.receiveAmount);
                        initCustomTooltip('buy');
                    } else {
                        tooltipTrigger.classList.add('d-none');
                        receiveInput.value = '';
                        hideCustomTooltip();
                    }
                });
            }
        }

        function initSellPayInput() {
            const input = document.getElementById('sell_pay_input');
            const receiveInput = document.getElementById('sell_receive_input');
            const tooltipTrigger = document.getElementById('sell_receive_tooltip_trigger');

            if (input && tooltipTrigger && receiveInput) {
                input.addEventListener('input', function() {
                    const value = parseFloat(this.value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    if (value > 0) {
                        tooltipTrigger.classList.remove('d-none');
                        const calculation = calculateSellAmount(value);
                        receiveInput.value = formatNumber(calculation.receiveAmount);
                        initCustomTooltip('sell');
                    } else {
                        tooltipTrigger.classList.add('d-none');
                        receiveInput.value = '';
                        hideCustomTooltip();
                    }
                });
            }
        }

        function initCustomTooltip(section = 'buy') {
            const triggerId = section === 'buy' ? 'buy_receive_tooltip_trigger' : 'sell_receive_tooltip_trigger';
            const trigger = document.getElementById(triggerId);
            const tooltip = document.getElementById('custom_tooltip');
            if (!trigger || !tooltip) return;
            trigger.removeEventListener('mouseenter', showCustomTooltip);
            trigger.removeEventListener('mouseleave', hideCustomTooltip);
            trigger.addEventListener('mouseenter', () => showCustomTooltip(section));
            trigger.addEventListener('mouseleave', hideCustomTooltip);
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                if (tooltip.classList.contains('d-none')) {
                    showCustomTooltip(section);
                    setTimeout(hideCustomTooltip, 5000);
                } else {
                    hideCustomTooltip();
                }
            });
        }

        function showCustomTooltip(section = 'buy') {
            const triggerId = section === 'buy' ? 'buy_receive_tooltip_trigger' : 'sell_receive_tooltip_trigger';
            const trigger = document.getElementById(triggerId);
            const tooltip = document.getElementById('custom_tooltip');
            if (!trigger || !tooltip) return;
            updateTooltipContent(section);
            const triggerRect = trigger.getBoundingClientRect();
            const tooltipTop = triggerRect.top - 240;
            const tooltipLeft = triggerRect.left - 143;
            tooltip.style.position = 'fixed';
            tooltip.style.top = `${tooltipTop}px`;
            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.zIndex = '100';
            tooltip.classList.remove('d-none');
        }

        function hideCustomTooltip() {
            const tooltip = document.getElementById('custom_tooltip');
            if (tooltip) {
                tooltip.classList.add('d-none');
            }
        }

        function initSellMaxButton() {
            const maxBtn = document.getElementById('sell_max_btn');
            const input = document.getElementById('sell_pay_input');
            const payBtn = document.getElementById('sell_pay_btn');

            if (maxBtn && input && payBtn) {
                maxBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const selectedCurrency = payBtn.querySelector('span').textContent;
                    const crypto = currencyData.cryptoCurrencies.find(c => c.code === selectedCurrency);
                    if (crypto && crypto.balance > 0) {
                        input.value = crypto.balance;
                        input.dispatchEvent(new Event('input'));
                    }
                });
            }
        }

        function calculateBuyAmount(payAmount) {
            const payBtn = document.getElementById('buy_pay_btn');
            const receiveBtn = document.getElementById('buy_receive_btn');
            const payCurrency = payBtn.querySelector('span').textContent;
            const receiveCurrency = receiveBtn.querySelector('span').textContent;
            const crypto = currencyData.cryptoCurrencies.find(c => c.code === receiveCurrency);
            if (!crypto) return {
                receiveAmount: 0,
                fee: 0,
                price: 0
            };
            const priceKey = payCurrency === 'USD' ? 'price_usd' : 'price_brl';
            const price = crypto[priceKey] || 0;
            const fee = (payAmount * currencyData.feeConfig.buy.percentage) / 100;
            const netAmount = payAmount - fee;
            const receiveAmount = price > 0 ? netAmount / price : 0;
            return {
                receiveAmount,
                fee,
                price,
                netAmount,
                payAmount,
                payCurrency,
                receiveCurrency
            };
        }

        function calculateSellAmount(sellAmount) {
            const payBtn = document.getElementById('sell_pay_btn');
            const receiveBtn = document.getElementById('sell_receive_btn');
            const sellCurrency = payBtn.querySelector('span').textContent;
            const receiveCurrency = receiveBtn.querySelector('span').textContent;
            const crypto = currencyData.cryptoCurrencies.find(c => c.code === sellCurrency);
            if (!crypto) return {
                receiveAmount: 0,
                fee: 0,
                price: 0
            };
            const priceKey = receiveCurrency === 'USD' ? 'price_usd' : 'price_brl';
            const price = crypto[priceKey] || 0;
            const grossAmount = sellAmount * price;
            const fee = (grossAmount * currencyData.feeConfig.sell.percentage) / 100;
            const receiveAmount = grossAmount - fee;
            return {
                receiveAmount,
                fee,
                price,
                grossAmount,
                sellAmount,
                sellCurrency,
                receiveCurrency
            };
        }

        function formatNumber(num, decimals = 8) {
            if (num === 0) return '0';
            if (num < 0.01) {
                return num.toFixed(decimals);
            }
            return num.toFixed(num < 1 ? 4 : 2);
        }

        function updateTooltipContent(section) {
            const tooltip = document.getElementById('custom_tooltip');
            if (!tooltip) return;
            let calculation;
            if (section === 'buy') {
                const input = document.getElementById('buy_pay_input');
                const value = parseFloat(input.value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                calculation = calculateBuyAmount(value);
            } else {
                const input = document.getElementById('sell_pay_input');
                const value = parseFloat(input.value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                calculation = calculateSellAmount(value);
            }
            const operation = section === 'buy' ? 'Compra' : 'Venda';
            let content = '';
            if (section === 'buy') {
                content =
                    `<div class="fw-bold text-center mb-2">Informações da ${operation}</div><hr class="my-2 border-secondary"><div class="mb-1 d-flex justify-content-between"><strong>Preço:</strong> 1 ${calculation.receiveCurrency} ≈ ${formatNumber(calculation.price, 2)} ${calculation.payCurrency}</div><div class="mb-1 d-flex justify-content-between"><strong>Pagar:</strong> ≈ ${formatNumber(calculation.payAmount, 2)} ${calculation.payCurrency}</div><div class="mb-1 d-flex justify-content-between"><strong>Taxa:</strong> ≈ ${formatNumber(calculation.fee, 2)} ${calculation.payCurrency}</div><div class="mb-2 d-flex justify-content-between"><strong>Receber:</strong> ≈ ${formatNumber(calculation.receiveAmount)} ${calculation.receiveCurrency}</div>`;
            } else {
                content =
                    `<div class="fw-bold text-center mb-2">Informações da ${operation}</div><hr class="my-2 border-secondary"><div class="mb-1 d-flex justify-content-between"><strong>Preço:</strong> 1 ${calculation.sellCurrency} ≈ ${formatNumber(calculation.price, 2)} ${calculation.receiveCurrency}</div><div class="mb-1 d-flex justify-content-between"><strong>Vender:</strong> ≈ ${formatNumber(calculation.sellAmount)} ${calculation.sellCurrency}</div><div class="mb-1 d-flex justify-content-between"><strong>Taxa:</strong> ≈ ${formatNumber(calculation.fee, 2)} ${calculation.receiveCurrency}</div><div class="mb-2 d-flex justify-content-between"><strong>Receber:</strong> ≈ ${formatNumber(calculation.receiveAmount, 2)} ${calculation.receiveCurrency}</div>`;
            }
            content +=
                `<hr class="my-2 border-secondary"><div class="text-muted"><small><strong>Observação:</strong> os preços das criptomoedas podem variar de acordo com as condições do mercado. Consulte o preço final na página de confirmação da ordem.</small></div>`;
            const tooltipContent = tooltip.querySelector('.tooltip-content');
            if (tooltipContent) {
                tooltipContent.innerHTML = content;
            }
        }

        function updateSubmitButtonText(btnId, currencyCode) {
            if (btnId === 'buy_receive_btn') {
                const submitBtn = document.getElementById('buy_submit_btn');
                if (submitBtn) {
                    submitBtn.textContent = `Comprar ${currencyCode}`;
                }
            } else if (btnId === 'sell_pay_btn') {
                const submitBtn = document.getElementById('sell_submit_btn');
                if (submitBtn) {
                    submitBtn.textContent = `Vender ${currencyCode}`;
                }
            }
        }

        function recalculateOnCurrencyChange(btnId) {
            if (btnId === 'buy_pay_btn' || btnId === 'buy_receive_btn') {
                const input = document.getElementById('buy_pay_input');
                if (input && input.value.trim() !== '') {
                    input.dispatchEvent(new Event('input'));
                }
            } else if (btnId === 'sell_pay_btn' || btnId === 'sell_receive_btn') {
                const input = document.getElementById('sell_pay_input');
                if (input && input.value.trim() !== '') {
                    input.dispatchEvent(new Event('input'));
                }
            }
        }


        let columns = [{
                name: 'unit_price',
                data: 'unit_price',
                columnTitle: 'Preço por Unidade',
            },
            {
                name: 'quantity',
                data: 'quantity',
                columnTitle: 'Quantidade',
            },
            {
                name: 'total_price',
                data: 'total_price',
                columnTitle: 'Preço Total',
            },
            {
                name: 'actions',
                data: 'actions',
                columnTitle: 'Ações',
                render: function(a, data, c) {
                    return `<button class="btn btn-sm btn-primary"><i class="bi-trash3 me-1"></i>Cancelar</button>`;
                }
            },

        ];

        function dataTableSettings(route) {
            return {
                url: route,
                columns: columns,
                export: false,
                search: false,
                createSearch: false,
                addPagination: false,
                autoUpdate: true,
            };
        }

        $(document).ready(function() {
            $('#table').dataTableLaravel({
                url: '{{ route('datatable.transactions') }}',
                token: '{{ csrf_token() }}',
                columns: columns,
                formFilters: '#formFilter',
                createSearch: false,
            });
        });
    </script>
@endsection
