import { Layout } from './components/Layout';
import logoImg from './assets/logo.png';
import { CreateWallet } from './components/CreateWallet';
import { BackupMnemonic } from './components/BackupMnemonic';
import { UnlockWallet } from './components/UnlockWallet';
import { ImportWallet } from './components/ImportWallet';
import { Dashboard } from './components/Dashboard';
import { Send } from './components/Send';
import { Receive } from './components/Receive';
import { History } from './components/History';
import { useWallet, type WalletView } from './hooks/useWallet';

function App() {
  const wallet = useWallet();

  const isLoggedIn = !!wallet.privateKey && !!wallet.walletData;
  const navViews = ['dashboard', 'send', 'receive', 'history'];

  const renderContent = () => {
    switch (wallet.view) {
      case 'landing':
        return (
          <div className="space-y-8 text-center py-12">
            <div>
              <img src={logoImg} alt="Nusacoin" className="w-20 h-20 rounded-3xl mx-auto mb-6" />
              <h1 className="text-3xl font-bold">Nusacoin Wallet</h1>
              <p className="text-dark-400 mt-3 max-w-md mx-auto">
                Secure, non-custodial web wallet. Your keys never leave your browser.
              </p>
            </div>

            <div className="card bg-dark-800/50 text-left max-w-md mx-auto space-y-3">
              <h3 className="text-sm font-semibold text-nux-400">Self-Custody Wallet</h3>
              <ul className="text-xs text-dark-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Your private keys are encrypted and stored <strong className="text-white">only in your browser</strong>. Our server never has access to your keys or funds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>No registration, no accounts, no personal data collected.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">&#9888;</span>
                  <span><strong className="text-yellow-300">If you lose your 12-word recovery phrase, your funds are permanently lost.</strong> No one can recover them for you — not even us.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              <button
                onClick={() => wallet.setView('create')}
                className="btn-primary w-full"
              >
                Create New Wallet
              </button>
              <button
                onClick={() => wallet.setView('import')}
                className="btn-secondary w-full"
              >
                Import Existing Wallet
              </button>
            </div>
          </div>
        );

      case 'create':
        return (
          <CreateWallet
            onSubmit={wallet.handleCreate}
            onBack={() => wallet.setView('landing')}
            loading={wallet.loading}
            error={wallet.error}
          />
        );

      case 'create-backup':
        return wallet.mnemonic ? (
          <BackupMnemonic
            mnemonic={wallet.mnemonic}
            onConfirm={() => wallet.setView('unlock')}
          />
        ) : null;

      case 'import':
        return (
          <ImportWallet
            onImport={wallet.handleImport}
            onBack={() => wallet.setView('landing')}
            loading={wallet.loading}
            error={wallet.error}
          />
        );

      case 'unlock':
        return wallet.walletData ? (
          <UnlockWallet
            address={wallet.walletData.address}
            onUnlock={wallet.handleUnlock}
            onLogout={wallet.handleLogout}
            loading={wallet.loading}
            error={wallet.error}
          />
        ) : null;

      case 'dashboard':
        return wallet.walletData ? (
          <Dashboard
            address={wallet.walletData.address}
            balance={wallet.balance}
            onRefresh={wallet.refreshBalance}
            onSend={() => wallet.setView('send')}
            onReceive={() => wallet.setView('receive')}
          />
        ) : null;

      case 'send':
        return wallet.walletData && wallet.privateKey ? (
          <Send
            address={wallet.walletData.address}
            privateKey={wallet.privateKey}
            balance={wallet.balance}
            onDone={() => {
              wallet.refreshBalance();
              wallet.setView('dashboard');
            }}
          />
        ) : null;

      case 'receive':
        return wallet.walletData ? (
          <Receive address={wallet.walletData.address} />
        ) : null;

      case 'history':
        return wallet.walletData ? (
          <History address={wallet.walletData.address} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout
      address={isLoggedIn ? wallet.walletData?.address : null}
      onLock={wallet.handleLock}
      onLogout={wallet.handleLogout}
      showNav={isLoggedIn && navViews.includes(wallet.view)}
      activeView={wallet.view}
      onNavigate={(v) => wallet.setView(v as WalletView)}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
