// Bootstrap Mechanic
// Allows players to install 1 JAW or JAWbreaker before the game begins
// Selections are revealed simultaneously

import { CardReference } from '../playerDecks/deckTwoRefactored';
import { resolveCardReference } from './deckResolver';
import { cardRegistry } from './cardRegistry';

export interface BootstrapState {
  playerBootstrapCard?: CardReference;
  enemyBootstrapCard?: CardReference;
  playerInstalled: boolean;
  enemyInstalled: boolean;
  bothRevealed: boolean;
}

export class BootstrapMechanic {
  private state: BootstrapState = {
    playerInstalled: false,
    enemyInstalled: false,
    bothRevealed: false
  };

  // Get available JAW/JAWbreaker cards for bootstrap
  getAvailableBootstrapCards(): CardReference[] {
    const availableCards: CardReference[] = [];
    
    // Check orange cards for JAW/JAWbreaker subtypes
    cardRegistry.orange.forEach((card, index) => {
      if (card.subTypes?.includes('JAW') || card.subTypes?.includes('JAWbreaker')) {
        availableCards.push({ faction: 'orange', index });
      }
    });
    
    // Check gray cards for JAW/JAWbreaker subtypes
    cardRegistry.gray.forEach((card, index) => {
      if (card.subTypes?.includes('JAW') || card.subTypes?.includes('JAWbreaker')) {
        availableCards.push({ faction: 'gray', index });
      }
    });
    
    return availableCards;
  }

  // Player selects bootstrap card
  selectPlayerBootstrap(cardReference: CardReference): boolean {
    if (this.state.playerInstalled) {
      console.error('Player has already installed bootstrap card');
      return false;
    }

    const card = resolveCardReference(cardReference);
    if (!card) {
      console.error('Invalid card reference for bootstrap');
      return false;
    }

    // Check if card is JAW or JAWbreaker
    const isJAW = card.subTypes?.includes('JAW') || card.subTypes?.includes('JAWbreaker');
    if (!isJAW) {
      console.error('Card must be JAW or JAWbreaker for bootstrap');
      return false;
    }

    this.state.playerBootstrapCard = cardReference;
    this.state.playerInstalled = true;
    
    console.log(`Player selected ${card.name} for bootstrap`);
    return true;
  }

  // Enemy selects bootstrap card (simple AI - random selection)
  selectEnemyBootstrap(): CardReference | null {
    if (this.state.enemyInstalled) {
      console.error('Enemy has already installed bootstrap card');
      return null;
    }

    const availableCards = this.getAvailableBootstrapCards();
    if (availableCards.length === 0) {
      console.error('No available bootstrap cards');
      return null;
    }

    // Simple AI: Random selection from available cards
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const selectedCard = availableCards[randomIndex];
    
    this.state.enemyBootstrapCard = selectedCard;
    this.state.enemyInstalled = true;
    
    const card = resolveCardReference(selectedCard);
    console.log(`Enemy selected ${card?.name} for bootstrap`);
    return selectedCard;
  }

  // Reveal both bootstrap cards simultaneously
  revealBootstrapCards(): { player: CardReference | undefined, enemy: CardReference | undefined } {
    if (!this.state.playerInstalled || !this.state.enemyInstalled) {
      console.error('Both players must select bootstrap cards before revealing');
      return { player: undefined, enemy: undefined };
    }

    this.state.bothRevealed = true;
    
    const playerCard = resolveCardReference(this.state.playerBootstrapCard!);
    const enemyCard = resolveCardReference(this.state.enemyBootstrapCard!);
    
    console.log(`Bootstrap revealed - Player: ${playerCard?.name}, Enemy: ${enemyCard?.name}`);
    
    return {
      player: this.state.playerBootstrapCard,
      enemy: this.state.enemyBootstrapCard
    };
  }

  // Get current bootstrap state
  getBootstrapState(): BootstrapState {
    return { ...this.state };
  }

  // Reset bootstrap mechanic (for new games)
  reset(): void {
    this.state = {
      playerInstalled: false,
      enemyInstalled: false,
      bothRevealed: false
    };
  }

  // Check if bootstrap phase is complete
  isBootstrapComplete(): boolean {
    return this.state.bothRevealed;
  }

  // Get bootstrap cards for game initialization
  getBootstrapCards(): { player: CardReference | undefined, enemy: CardReference | undefined } {
    if (!this.state.bothRevealed) {
      console.warn('Bootstrap cards not revealed yet');
    }
    
    return {
      player: this.state.playerBootstrapCard,
      enemy: this.state.enemyBootstrapCard
    };
  }

  // Install bootstrap card to player's starting area
  installBootstrapCard(cardReference: CardReference, owner: 'player' | 'enemy'): any {
    const card = resolveCardReference(cardReference);
    if (!card) {
      throw new Error('Invalid bootstrap card reference');
    }

    // Create card instance for game board
    const cardInstance = {
      id: `${owner === 'player' ? 'p' : 'e'}_bootstrap`,
      card,
      power: card.power || 0,
      HP: card.HP || 0,
      wounds: 0,
      exposed: false,
      scored: false,
      readied: false,
      ascended: false,
      online: true, // Bootstrap cards start online
      tapped: false,
      sacrificed: false,
      steps: 0,
      freeze: 0,
      decay: 0,
      venom: 0,
      damage: 0,
      shield: 0,
      counters: 0,
      development: 0,
      charge: 0,
      cosmic: 1,
      deathless: 0,
      pounce: 0,
      override: 0,
      stealth: 0,
      armored: 0,
      solo: 0,
      plot: 0,
      tokens: [],
      abilities: card.abilities || [],
      keywords: card.keywords || [],
      faction: card.faction,
      category: card.category,
      owner: owner.toUpperCase(),
      isBootstrap: true // Mark as bootstrap card
    };

    console.log(`Installed bootstrap card ${card.name} for ${owner}`);
    return cardInstance;
  }
}

// Singleton instance for game
export const bootstrapMechanic = new BootstrapMechanic();

// Helper functions
export function getBootstrapMechanic(): BootstrapMechanic {
  return bootstrapMechanic;
}

export function isJAWOrJAWbreaker(cardReference: CardReference): boolean {
  const card = resolveCardReference(cardReference);
  return card?.subTypes?.includes('JAW') || card?.subTypes?.includes('JAWbreaker') || false;
}
