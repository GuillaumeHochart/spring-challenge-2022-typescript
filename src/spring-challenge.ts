//MAP
import {readline} from "./readline";

/** 260 argent 2500 total **/

var inputs: string[] = readline().split(' ');
const baseX: number = parseInt(inputs[0]);
const baseY: number = parseInt(inputs[1]);


//CONSTANTE
const maxX: number = 17630;
const maxY: number = 9000;
const localDistanceFocus = 500
const monsterBaseFocusDistance = 6000
const baseSize = 6000;
const minLifeMonster = 13;
const minManaForAtt = 200
let manaUsed = 10;
let turn = 1
const turnChangeStrat = 85
const farmTurn = 50

const enum HEROTYPE {
    def = "DEFENSEUR",
    explore = "EXPLORE",
    att = "ATTAQUE"
}

const enum ORDERTYPE {
    spell = "SPELL",
    move = "MOVE",
    focus = "FOCUS"
}

const heroZone = 3000

//ENTITY TYPE
const MONSTERS = 0;
const HEROES = 1
const HEROESENNEMY = 2

//SORT NAME
const WIND = "WIND"
const SHIELD = "SHIELD"
const CONTROL = "CONTROL"

//CLASS
class ParentOrder {
    name: string;
    priority: number;
    restriction: string[];
    type: string;


    constructor(name: string, priority: number, restriction: string[], type: string) {
        this.name = name;
        this.priority = priority;
        this.restriction = restriction;
        this.type = type;
    }
}

class Order extends ParentOrder {

    condition: boolean;

    constructor(orderType: ParentOrder, hero: MyHero, condition: boolean) {
        super(orderType.name, orderType.priority, orderType.restriction, orderType.type);
        this.condition = checkHeroTypes(hero, orderType.restriction) && condition;
    }
}

class ORDERS {
    private static i: number = 0;

    public static readonly focusHeroToShield = new ParentOrder('Focus allié a qui donner le shield', this.i++, [HEROTYPE.def,HEROTYPE.explore,HEROTYPE.att], ORDERTYPE.focus)
    public static readonly moveToOpposedBase = new ParentOrder('Se déplacer vers la base adverse', this.i++, [HEROTYPE.att], ORDERTYPE.move)
    public static readonly focusMonsterProximityForShield = new ParentOrder('Focus le monstre le plus proche pour shield', this.i++, [HEROTYPE.att], ORDERTYPE.focus)
    public static readonly focusEnemyInOpposedBase = new ParentOrder('Focus le héro ennemie le plus proche', this.i++, [HEROTYPE.att], ORDERTYPE.focus)
    public static readonly focusMonsterBase = new ParentOrder('Focus le monstre proche de notre base', this.i++, [HEROTYPE.def,HEROTYPE.explore], ORDERTYPE.focus)
    public static readonly focusEnemyToWind = new ParentOrder('Focus enemy To push', this.i++, [HEROTYPE.def], ORDERTYPE.focus)
    public static readonly focusMonsterZone = new ParentOrder('Focus le monstre autour de nous', this.i++, [HEROTYPE.def, HEROTYPE.explore], ORDERTYPE.focus)
    public static readonly focusMonsterProximity = new ParentOrder('Focus le monstre le plus proche', this.i++, [HEROTYPE.explore,HEROTYPE.att], ORDERTYPE.focus)
    public static readonly focusMonsterProximityDef = new ParentOrder('Focus le monstre le plus proche en def', this.i++, [HEROTYPE.def], ORDERTYPE.focus)
    public static readonly focusMonsterProximityByZone = new ParentOrder('Focus le monstre le plus proche dans ma zone', this.i++, [HEROTYPE.explore,HEROTYPE.att], ORDERTYPE.focus)

    public static readonly runWindOffense = new ParentOrder('lancer le sort de vent pour pousser dans le camp advers', this.i++, [HEROTYPE.att], ORDERTYPE.spell)

    public static readonly runShieldOnMonster = new ParentOrder('lancer un shield sur un monstre', this.i++, [HEROTYPE.att], ORDERTYPE.spell)
    public static readonly runShield = new ParentOrder('lancer un shield', this.i++, [HEROTYPE.def, HEROTYPE.explore,HEROTYPE.att], ORDERTYPE.spell)

    public static readonly runWind = new ParentOrder('lancer le sort de vent pour repousser une orde en defense', this.i++, [HEROTYPE.def], ORDERTYPE.spell)
   // public static readonly runWindOnHero = new ParentOrder('lancer le sort de vent pour repousser un enemy', this.i++, [HEROTYPE.def], ORDERTYPE.spell)

    public static readonly runControl = new ParentOrder('lancer le sort de control', this.i++, [HEROTYPE.att], ORDERTYPE.spell)
    public static readonly runControlByDef = new ParentOrder('lancer le sort de control', this.i++, [HEROTYPE.def], ORDERTYPE.spell)

    public static readonly runControlOnHero = new ParentOrder('lancer le sort de control', this.i++, [HEROTYPE.att], ORDERTYPE.spell)

    public static readonly moveAwayIfControlledMonsterProximity = new ParentOrder('éloigner si un monstre controllé à proximité se dirige vers la base adverse', this.i++, [HEROTYPE.def, HEROTYPE.explore, HEROTYPE.att], ORDERTYPE.move)
    public static readonly moveToFocus = new ParentOrder('Se déplacer vers le focus', this.i++, [HEROTYPE.att, HEROTYPE.explore, HEROTYPE.def], ORDERTYPE.move)
    public static readonly moveToFarmZone = new ParentOrder('Se déplacer vers la zone de farm', this.i++, [HEROTYPE.explore], ORDERTYPE.move)
    public static readonly moveToDefZone = new ParentOrder('Se déplacer vers la zone de def', this.i++, [HEROTYPE.def], ORDERTYPE.move)

    public static readonly patrol = new ParentOrder('patrouille autour de la base ennemi', this.i++, [HEROTYPE.att], ORDERTYPE.move)
    public static readonly randomMove = new ParentOrder('Mouvement aléatoire dans une zone', this.i++, [HEROTYPE.explore,HEROTYPE.att], ORDERTYPE.move)
    public static readonly wait = new ParentOrder('waite', this.i++, [HEROTYPE.explore,HEROTYPE.def,HEROTYPE.att], ORDERTYPE.move)


    private constructor(public readonly name: string, public readonly priority: number, restriction: string) {
    }
}

class Position {
    x: number;
    y: number;


    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

let farmZones : Position[] = farmZonesContent()

function farmZonesContent() : Position[] {
    let result : Position[] = []
    if (baseX == 0) {
        result.push(new Position(4500, 3000))
        result.push(new Position(5000, 7000))
        result.push(new Position(10000, 1000))

    } else {
        result.push(new Position(13000, 5200))
        result.push(new Position(9000, 8000))
        result.push(new Position(15000, 1000))
    }
    return result
}

let defZones : Position[] = defZonesContent()

function defZonesContent() : Position[] {
    let result : Position[] = []
    if (baseX == 0) {
        result.push(new Position(5700, 2200))
        result.push(new Position(3500, 4500))
        result.push(new Position(3500, 4500))
    } else {
        result.push(new Position(12500, 7200))
        result.push(new Position(12500, 7200))
        result.push(new Position(14500, 4000))
    }
    return result
}

let attZones : Position[] = attZonesContent()

function attZonesContent() : Position[] {
    let result : Position[] = []
    if (baseX == 0) {
        result.push(new Position(14000, 6500))
        result.push(new Position(14000, 6500))
        result.push(new Position(14000, 6500))

    } else {
        result.push(new Position(3300, 2400))
        result.push(new Position(3300, 2400))
        result.push(new Position(3300, 2400))
    }
    return result
}




abstract class Entity {
    id: number
    type: number
    x: number
    y: number
    shieldLife: number
    isControlled: number
    health: number
    vx: number
    vy: number
    nearBase: number
    threatFor: number


    constructor(id: number,
                type: number,
                x: number,
                y: number,
                shieldLife: number,
                isControlled: number,
                health: number,
                vx: number,
                vy: number,
                nearBase: number,
                threatFor: number) {
        this.id = id
        this.x = x
        this.y = y
        this.shieldLife = shieldLife
        this.health = health
        this.vx = vx
        this.vy = vy
        this.nearBase = nearBase
        this.threatFor = threatFor
        this.isControlled = isControlled
        this.type = type
    }
}

class MyHero extends Entity {

    targetId?: Entity | null;
    additionnalType?: string;
    explorePosition: Position;
    defPosition: Position;
    attPosition: Position;
    hasExecuteAction : boolean = false;
    hasExcuteFocus : boolean = false;
    leftObjectivePatrol : boolean = true;

    constructor(id: number,
                x: number,
                y: number,
                explorePosition: Position,
                defPosition: Position,
                attPosition: Position,
                shieldLife: number,
                isControlled: number,
                health: number,
                vx: number,
                vy: number,
                nearBase: number,
                threatFor: number,
                leftObjectivePatrol:boolean,
                targetId?: Entity | null,
                additionnalType?: string) {
        super(id, HEROES, x, y, shieldLife, isControlled, health, vx, vy, nearBase, threatFor)
        this.explorePosition = explorePosition
        this.defPosition = defPosition
        this.attPosition = attPosition
        this.additionnalType = additionnalType
        this.targetId = targetId
        this.leftObjectivePatrol = leftObjectivePatrol
    }
}

class Monster extends Entity {
    constructor(id: number,
                x: number,
                y: number,
                shieldLife: number,
                isControlled: number,
                health: number,
                vx: number,
                vy: number,
                nearBase: number,
                threatFor: number) {
        super(id, MONSTERS, x, y, shieldLife, isControlled, health, vx, vy, nearBase, threatFor)

    }
}

class OpposedHero extends Entity {
    constructor(id: number,
                x: number,
                y: number,
                shieldLife: number,
                isControlled: number,
                health: number,
                vx: number,
                vy: number,
                nearBase: number,
                threatFor: number) {
        super(id, HEROESENNEMY, x, y, shieldLife, isControlled, health, vx, vy, nearBase, threatFor)

    }
}

class DefGard extends MyHero {

    constructor(hero:MyHero) {
        super(hero.id,
            hero.x,
            hero.y,
            hero.explorePosition,
            hero.defPosition,
            hero.attPosition,
            hero.shieldLife,
            hero.isControlled,
            hero.health,
            hero.vx,
            hero.vy,
            hero.nearBase,
            hero.threatFor,
            hero.leftObjectivePatrol,
            hero.targetId,
            HEROTYPE.def)
    }
}

class ExploreGard extends MyHero  {

    constructor(hero:MyHero) {
        super(hero.id,
            hero.x,
            hero.y,
            hero.explorePosition,
            hero.defPosition,
            hero.attPosition,
            hero.shieldLife,
            hero.isControlled,
            hero.health,
            hero.vx,
            hero.vy,
            hero.nearBase,
            hero.threatFor,
            hero.leftObjectivePatrol,
            hero.targetId,
            HEROTYPE.explore)
    }
}

class GlobalState {

    controlledHero: Entity[] = [];
    monstersOnMyBase: Entity[] = [];
    enemies: Entity[] = [];
    monsters: Entity[] = [];
    opposedHeroes: Entity[] = [];
    myHeroes: Entity[] = [];
    defWithoutShield: Entity[] = [];
    monsterAggroZone: Entity[] = [];
    monsterControlledInMyZone: Entity[] = [];
    hero : MyHero;
    orders : Order[];
    monsterBaseNotFocus : Entity | null | undefined;
    monsterInMyZone : Entity [];
    monsterOpposedBaseFocus : Entity [];


    constructor(orders : Order[],
                hero : MyHero,
                controlledHero: Entity[],
                monstersOnMyBase: Entity[],
                enemies: Entity[],
                monsters: Entity[],
                opposedHeroes: Entity[],
                myHeroes: Entity[],
                defWithoutShield: Entity[],
                monsterAggroZone: Entity[],
                monsterControlledInMyZone: Entity[],
                monsterBaseNotFocus : Entity | null | undefined,
                monsterInMyFarmZone : Entity [],
                monsterOpposedBaseFocus : Entity []) {

        this.controlledHero = controlledHero;
        this.hero = hero;
        this.orders = orders;
        this.monsterBaseNotFocus = monsterBaseNotFocus;
        this.monstersOnMyBase = monstersOnMyBase;
        this.enemies = enemies;
        this.monsters = monsters;
        this.opposedHeroes = opposedHeroes;
        this.myHeroes = myHeroes;
        this.defWithoutShield = defWithoutShield;
        this.monsterAggroZone = monsterAggroZone;
        this.monsterControlledInMyZone = monsterControlledInMyZone;
        this.monsterInMyZone = monsterInMyFarmZone;
        this.monsterOpposedBaseFocus = monsterOpposedBaseFocus;
    }
}

class AttGard extends MyHero  {

    constructor(hero:MyHero) {
        super(hero.id,
            hero.x,
            hero.y,
            hero.explorePosition,
            hero.defPosition,
            hero.attPosition,
            hero.shieldLife,
            hero.isControlled,
            hero.health,
            hero.vx,
            hero.vy,
            hero.nearBase,
            hero.threatFor,
            hero.leftObjectivePatrol,
            hero.targetId,
            HEROTYPE.att)
    }
}

//GLOBAL VARIABLE
let currentsEntities: Entity[] = []
let heroes: Map<number, MyHero> = new Map();
const heroesPerPlayer: number = parseInt(readline());
let myHealth = 0;
let myMana = 0;
let opposedMana = 0;
let opposedLife = 0;
let defByDefault: number = 1;
let attByDefault: number = 1;
let monsterBaseFocus: Entity[] = []
let idAtt :number | null | undefined = null
const attManaDown = 50
//RUNNING EXECUTION

log("BASE POSITION X " + baseX + " Y " + baseY)

while (true) {

    playerInfoSaveRun()

    entityFactory(currentsEntities)

    executeOrders(orderFactory(currentsEntities))

    updateDefByDefault()
    clearTarget(currentsEntities, heroes)
    currentsEntities = []
    manaUsed = 10;
    turn++
}


//EXECUTION METHOD
function playerInfoSaveRun() {
    for (let i = 0; i < 2; i++) {
        inputs = readline().split(' ');
        if (i == 0) {
            myHealth = parseInt(inputs[0]);
            myMana = parseInt(inputs[1]);
        }else {
            opposedLife = parseInt(inputs[0]);
            opposedMana = parseInt(inputs[1]);
        }
    }
}

function clearTarget(entities: Entity[], heros: Map<number, MyHero>) {
    Array.from(heros.values()).forEach(hero => {
            if (hero.targetId != null) {
                if (!entities.map(entity => entity.id).includes(hero.targetId.id)) {
                    hero.targetId = null;
                    heros.set(hero.id, hero)
                } else {
                    if(hero.targetId.type == MONSTERS){
                        hero.targetId = getEntityById(entities,hero.targetId.id)
                        if(hero.targetId.x == null) hero.targetId = null
                        if(hero.targetId?.threatFor == 2) hero.targetId = null
                        if(hero.targetId?.isControlled == 1 && hero.targetId?.threatFor != 0) hero.targetId = null
                    }else {
                        hero.targetId = null
                    }
                    heros.set(hero.id, hero)
                }
            }
        }
    )
}



//FACTORY
function entityFactory(entities: Entity[]) {
    const entityCount: number = parseInt(readline()); // Amount of heros and monsters you can see
    for (let i = 0; i < entityCount; i++) {
        inputs = readline().split(' ');

        let entity: Entity = getTypeEntityByInputs()
        entities.push(entity)
    }
    monsterBaseFocus = getMonsterBaseFocus(currentsEntities)

    entities.forEach((entity => {
        if (entity instanceof MyHero) {
            saveOldData(entity, heroes)
        }
    }))
    heroRoleAttribution(entities, heroes)
    zonePositionFactory(heroes)

    log("MONSTERS FOCUS ON MY BASE " + monsterBaseFocus.length)

}

function orderFactory(entities: Entity[]) : GlobalState[] {

    let controlledHero = getControlledHeroes();
    let monstersOnMyBase: Entity[] = getMonsterBaseFocus(entities)

    let result: GlobalState[] = []

    getHeroes().forEach(hero => {

        let enemies = sortProximityEntity(getOpposed(entities), hero);
        let monsters = sortProximityEntity(getMonsters(entities), hero);
        let monsterAggroZone = getMonsterInAggroZone(monsters, hero)
        let monsterInWindZone = getMonsterInWindZone(monsters, hero)
        let monsterControlledInMyZone = getMonsterControlled(monsterAggroZone)
        let monsterBaseNotFocus = getMonsterBaseClosestNotFocused(hero, currentsEntities, heroes)
        let monsterInZone = getMonstersInZone(monsters,hero);
        let monsterOpposedBaseFocusWithoutShield = getMonsterOpposedBaseFocusWithoutShield(monsters)
        let monsterOpposedBase = getMonsterOpposedBaseFocus(monsters)
        let focus = getDefMonsterFocus(monsters,hero);

        let opposedHeroes = sortProximityEntity(getOpposedHeroes(entities), hero);
        let opposedInOpposedBase = getOpposedHeroesInOpposedBase(opposedHeroes);

        let myHeroes = sortProximityEntity(getHeroes(), hero);
        let heroesWithoutShield = getHeroesDefWithoutShield(myHeroes);




        log("############ HERO ID " + hero.id + " TYPE " + hero.additionnalType+" #########################")


        //log("DISTANCE ENEMY P "+vectorSizeMonsterHero(hero, opposedHeroes[0]))
        let focusOrders: Order[] = [
            new Order(ORDERS.focusHeroToShield, hero,
                heroesWithoutShield.length > 0 &&
                vectorSizeMonsterHero(hero, heroesWithoutShield[0])<2200 &&
                vectorSizeMonsterHero(hero, opposedHeroes[0])<2300 && myMana>10 &&
                turn > turnChangeStrat),

            new Order(ORDERS.focusEnemyToWind, hero,
                hero.shieldLife>0 &&
                vectorSizeMonsterHero(hero, opposedHeroes[0])<1280 && myMana>20 &&
                turn > turnChangeStrat),

            new Order(ORDERS.focusMonsterBase, hero,
                monstersOnMyBase.length != 0 &&
                (turn < turnChangeStrat || hero.additionnalType === HEROTYPE.def) &&
                monsterBaseNotFocus != null),

            new Order(ORDERS.focusMonsterProximity, hero,
                monsters.length > 0 &&
                hero.targetId == null &&
                checkFocusMonsterClosest(monsters[0]) &&
                !excludeFocus(heroes,hero).includes(monsters[0].id) &&
                (monsters[0].threatFor != 2 || (myMana < attManaDown && !isInOpposedBase(monsterAggroZone[0])) ) &&
                !checkIfHeroesHasBetterPositionOfMe(hero,monsters[0])),

            new Order(ORDERS.focusMonsterProximityDef, hero,
                monsters.length > 0 &&
                hero.targetId == null &&
                (turn < turnChangeStrat || focus?.threatFor == 1) &&
                vectorSizeEntityBase(focus) <5000 &&
                checkFocusMonsterClosest(monsters[0]) &&
                (turn > turnChangeStrat || !excludeFocus(heroes,hero).includes(monsters[0].id)) &&
                monsters[0].threatFor != 2 &&
                !checkIfHeroesHasBetterPositionOfMe(hero,monsters[0])),

            new Order(ORDERS.focusMonsterProximityByZone, hero,
                monsterInZone.length > 0 &&
                hero.targetId == null),

            new Order(ORDERS.focusEnemyInOpposedBase, hero,
                monsterOpposedBase.length > 2 &&
                canUseASort("CONTROL",opposedHeroes[0],hero)&&
                hero.targetId == null),

            new Order(ORDERS.focusMonsterProximityForShield, hero,
                monsterOpposedBaseFocusWithoutShield.length > 0 &&
                hero.targetId == null &&
                vectorSizeOpposedBase(defaultFocusForMonsterShield(monsters,hero)) <9000),

            new Order(ORDERS.focusMonsterZone, hero,
                monsterAggroZone.length > 0 &&
                monsterControlledInMyZone.length == 0 &&
                (monsterAggroZone[0].threatFor != 2 || (myMana < attManaDown && !isInOpposedBase(monsterAggroZone[0])) )),
            // new Order(ORDERS.focusEnemyInOpposedBase, hero, opposedHeroes.length > 0 && (opposedHeroes[0].isControlled == 0 || opposedHeroes[0].isControlled == null)&& isInOpposedBase(hero)&& vectorSizeMonsterHero(hero,opposedHeroes[0]) < 2200 )
        ]

        focusOrders.filter(order=>order.condition).forEach(order => log("ORDER " + order.name + " PRIORITY " + order.priority))

        executeFocus(new GlobalState(
            focusOrders.filter(order =>order.condition),
            hero,
            controlledHero,
            monstersOnMyBase,
            enemies,
            monsters,
            opposedHeroes,
            myHeroes,
            heroesWithoutShield,
            monsterAggroZone,
            monsterControlledInMyZone,
            monsterBaseNotFocus,
            monsterInZone,
            monsterOpposedBaseFocusWithoutShield))

        //FAIRE UN ORDER POUR LES SORTS AUSSI AFIN DE CHECK LE MANA SUR LE NOMBRE DE SORT QUE L'ON VA EXECUTER
        let orders: Order[] = [
            new Order(ORDERS.runWind, hero,
                canUseASort(WIND, enemies[0], hero) &&
                (monsterInWindZone.length >= 2 ||
                    monsterInWindZone.length > 0 && vectorSizeEntityBase(monsters[0])<1500) ||
                vectorSizeEntityBase(opposedHeroes[0]) < 5000 && opposedHeroes[0].shieldLife == 0 ),

            new Order(ORDERS.runWindOffense, hero,
                monsterInWindZone.length > 0 &&
                (monsterInWindZone.length >= 2 || vectorSizeOpposedBase(monsterInWindZone[0]) < 5000) &&
            canUseASort(WIND, enemies[0], hero)),

            /*new Order(ORDERS.runWindOnHero, hero,
                canUseASort(WIND, enemies[0], hero) &&
                vectorSizeMonsterHero(hero, opposedHeroes[0])<1280 &&
                vectorSizeEntityBase(monsters[0])<8000),*/

            new Order(ORDERS.runControl, hero,
                canUseASort(CONTROL, hero.targetId, hero)) ,

            new Order(ORDERS.runControlByDef, hero,
                canUseASort(CONTROL, hero.targetId, hero) &&
                opposedInOpposedBase.length == 3 &&
                vectorSizeEntityBase(hero.targetId) > 4000 &&
                vectorSizeMonsterHero(hero,hero.targetId) > 1280
                )
            ,

            new Order(ORDERS.runControlOnHero, hero,
                canUseASort(CONTROL, hero.targetId, hero) &&
                turn > turnChangeStrat &&
                isInOpposedBase(hero.targetId) ) ,

            new Order(ORDERS.runShield, hero,
                canUseASort(SHIELD, hero.targetId, hero) &&
                heroesWithoutShield.length > 0),

            new Order(ORDERS.runShieldOnMonster, hero,
                canUseASort(SHIELD, hero.targetId, hero)),

            new Order(ORDERS.moveToOpposedBase, hero, vectorSizeOpposedBase(hero) > 7000 && turn > turnChangeStrat && myMana > 100),
            new Order(ORDERS.moveToFarmZone, hero, hero.targetId == null && !isInMyZone(hero)),
            new Order(ORDERS.moveToDefZone, hero, true),
            new Order(ORDERS.patrol, hero, hero.targetId == null),
            new Order(ORDERS.randomMove, hero, monsterInZone.length == 0),
            new Order(ORDERS.wait, hero, true),
            new Order(ORDERS.moveAwayIfControlledMonsterProximity, hero, monsterControlledInMyZone.length > 0),
            new Order(ORDERS.moveToFocus, hero,
                hero.targetId != null &&
                (hero.targetId.threatFor != 2 || myMana <70 ) &&
                hero.targetId.x != null)
        ]

        // In function of order change focus
        result.push(new GlobalState(
            orders.filter(order =>order.condition),
            hero,
            controlledHero,
            monstersOnMyBase,
            enemies,
            monsters,
            opposedHeroes,
            myHeroes,
            heroesWithoutShield,
            monsterAggroZone,
            monsterControlledInMyZone,
            monsterBaseNotFocus,
            monsterInZone,
            monsterOpposedBaseFocusWithoutShield))
    })
    return result;
}

function executeOrders(globalState:GlobalState[]){

    globalState.forEach(globalState => {
        let effectiveOrder = sortOrderPriority(globalState.orders.filter(order => order.condition));

        log("################HERO ID " + globalState.hero.id + " TYPE " + globalState.hero.additionnalType+"######################")

        effectiveOrder.forEach(order => log("-----ORDER " + order.name + " PRIORITY " + order.priority+"------"))

        executeSpell(globalState)
        executeMove(globalState)

        if(globalState.hero.targetId != null){
            console.error("################ FOCUS ID " +  globalState.hero.targetId.id+" x "+globalState.hero.targetId.x +" y "+globalState.hero.targetId.y+"#####################################")
        }else {
            console.error("################ NO FOCUS #####################################")

        }
    })

}

//EXECUTE ORDER

function executeFocus(globalState:GlobalState) {
    let orders = globalState.orders.filter(order => order.type = ORDERTYPE.focus)

    sortOrderPriority(orders).forEach(order=>{
        if(globalState.hero.hasExcuteFocus) return;

        switch (order.name) {
            case ORDERS.focusEnemyInOpposedBase.name :
                globalState.hero.targetId = globalState.opposedHeroes[0]
                globalState.hero.hasExcuteFocus = true
                break
            case ORDERS.focusHeroToShield.name :
                globalState.hero.targetId = globalState.defWithoutShield[0]
                globalState.hero.hasExcuteFocus = true
                break
            case ORDERS.focusEnemyToWind.name :
                globalState.hero.targetId = globalState.opposedHeroes[0]
                globalState.hero.hasExcuteFocus = true
                break
            case ORDERS.focusMonsterZone.name :
                globalState.hero.targetId = globalState.monsterAggroZone[0]
                globalState.hero.hasExcuteFocus = true
                break
            case ORDERS.focusMonsterBase.name :
                globalState.hero.hasExcuteFocus = true
                globalState.hero.targetId = getMonsterBaseClosestNotFocused(globalState.hero, currentsEntities, heroes)
                break
            case ORDERS.focusMonsterProximity.name :
                globalState.hero.hasExcuteFocus = true
                globalState.hero.targetId = getDefMonsterFocus(globalState.monsters,globalState.hero)
                break
            case ORDERS.focusMonsterProximityDef.name :
                globalState.hero.hasExcuteFocus = true
                globalState.hero.targetId = getDefMonsterFocus(globalState.monsters,globalState.hero)
                break
            case ORDERS.focusMonsterProximityByZone.name :
                globalState.hero.hasExcuteFocus = true
                globalState.hero.targetId = globalState.monsterInMyZone[0]
                break
            case ORDERS.focusMonsterProximityForShield.name :
                globalState.hero.hasExcuteFocus = true
                globalState.hero.targetId = globalState.monsterOpposedBaseFocus[0]
                break
        }
    })
}
function executeSpell(globalState:GlobalState) {
    let orders = globalState.orders.filter(order => order.type = ORDERTYPE.spell)

    sortOrderPriority(orders).forEach(order=>{
        if(globalState.hero.hasExecuteAction) return;

        try {
            switch (order.name) {
                case ORDERS.runShield.name :
                    useShield(globalState.hero.targetId)
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
                case ORDERS.runShieldOnMonster.name :
                    useShield(globalState.hero.targetId)
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
                case ORDERS.runWind.name :
                    useWind(globalState.hero)
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
                case ORDERS.runWindOffense.name :
                    useWind(globalState.hero)
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
               /* case ORDERS.runWindOnHero.name :
                    useWind(globalState.hero)
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break**/
                case ORDERS.runControl.name :
                    useControl(globalState.hero.targetId)
                    globalState.hero.targetId = null
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
                case ORDERS.runControlByDef.name :
                    useControl(globalState.hero.targetId)
                    globalState.hero.targetId = null
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
                case ORDERS.runControlOnHero.name :
                    useControl(globalState.hero.targetId)
                    globalState.hero.targetId = null
                    globalState.hero.hasExecuteAction = true
                    manaUsed = manaUsed +10
                    break
            }
        }catch (e){
            console.error(e)
        }
    })

}
function executeMove(globalState:GlobalState) {
    let orders = globalState.orders.filter(order => order.type = ORDERTYPE.move)

    sortOrderPriority(orders).forEach(order=>{
        if(globalState.hero.hasExecuteAction) return;

        switch (order.name) {
            case ORDERS.moveAwayIfControlledMonsterProximity.name :
                let monster = globalState.monsterControlledInMyZone[0]
                move(monster.x - 400, monster.y - 400, globalState.hero.id, globalState.hero.id)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.moveToOpposedBase.name :
                move(globalState.hero.attPosition.x, globalState.hero.attPosition.y, globalState.hero.id, globalState.hero.id)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.moveToDefZone.name :
                move(globalState.hero.defPosition.x, globalState.hero.defPosition.y, globalState.hero.id, globalState.hero.id)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.moveToFarmZone.name :
                move(globalState.hero.explorePosition.x, globalState.hero.explorePosition.y, globalState.hero.id, globalState.hero.id)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.randomMove.name :
                moveRand(globalState.hero)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.patrol.name :
                movePatrol(globalState.hero)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.moveToFocus.name :
                if(globalState.hero.targetId == null) moveRand(globalState.hero)
                else move(globalState.hero.targetId.x, globalState.hero.targetId.y, globalState.hero.id, globalState.hero.id)
                globalState.hero.hasExecuteAction = true
                break
            case ORDERS.wait.name :
                console.log("WAIT rien à faire...")
                globalState.hero.hasExecuteAction = true
                break


        }
    })

}
function getOpposedHeroesInOpposedBase(opposedHeroes : Entity[]) {
    return opposedHeroes.filter(hero=>vectorSizeOpposedBase(hero)<baseSize)
}

function getMonstersInZone(monsters : Entity[],hero : MyHero){

    let result = monsters.filter(monster =>{
        opposedIsInMyZone(hero,monster)
    })
    return sortProximityEntity(result,hero)
}

//HERO STATE ATTRIBUTION
function saveOldData(myHero: MyHero, heros: Map<number, MyHero>) {
    let currentHero = heros.get(myHero.id);

    if (currentHero != null) {
        myHero.targetId = currentHero.targetId
        myHero.explorePosition = currentHero.explorePosition
        myHero.attPosition = currentHero.attPosition
        myHero.defPosition = currentHero.defPosition
        myHero.leftObjectivePatrol = currentHero.leftObjectivePatrol

    }
    heros.set(myHero.id, myHero)
}

function heroRoleAttribution(entities: Entity[], heros: Map<number, MyHero>) {

    let indexDef = 0;
    let indexAtt = 0;

    sortProximityBase(Array.from(heros.values())).forEach(hero => {

            if(turn < farmTurn) {
                hero = new ExploreGard(hero)

            }else if (indexDef < getDefByDefaultBySumMonsterFocus(monsterBaseFocus.length)) {
                hero = new DefGard(hero);
                indexDef++;
            } else if (indexAtt < attByDefault && turn >= turnChangeStrat) {
                hero = new AttGard(hero)
                indexAtt++;
                idAtt = hero.id
            } else {
                hero = new ExploreGard(hero)
            }
            heros.set(hero.id, hero)
        }
    )
}


//DEF GESTION METHOD
function updateDefByDefault() {
    log(" MY LIFE " + myHealth)

    if (myHealth == 2) {
        defByDefault = 2;
    }
    if (myHealth == 1) {
        defByDefault = 3
    }
}

function getDefByDefaultBySumMonsterFocus(monstersFocusLenght: number): number {
    let localeDefByDefault = defByDefault;

    if (localeDefByDefault == 1) {
        if (monstersFocusLenght >= 3) localeDefByDefault = 2
    }
    if (turn>= turnChangeStrat) {
        localeDefByDefault = 2
    }else if (turn> turnChangeStrat && myMana < 40) {
        localeDefByDefault = 3
    }

    return localeDefByDefault;
}

//REPOSITORY METHOD
function getTypeEntityByInputs() {
    const id: number = parseInt(inputs[0]); // Unique identifier
    const type: number = parseInt(inputs[1]); // 0=monster, 1=your hero, 2=opponent hero
    const x: number = parseInt(inputs[2]); // Position of this entity
    const y: number = parseInt(inputs[3]);
    const shieldLife: number = parseInt(inputs[4]); // Ignore for this league; Count down until shield spell fades
    const isControlled: number = parseInt(inputs[5]); // Ignore for this league; Equals 1 when this entity is under a control spell
    const health: number = parseInt(inputs[6]); // Remaining health of this monster
    const vx: number = parseInt(inputs[7]); // Trajectory of this monster
    const vy: number = parseInt(inputs[8]);
    const nearBase: number = parseInt(inputs[9]); // 0=monster with no target yet, 1=monster targeting a base
    const threatFor: number = parseInt(inputs[10]); // Given this monster's trajectory, is it a threat to 1=your base, 2=your opponent's base, 0=neither

    switch (type) {
        case MONSTERS :
            return new Monster(id, x, y, shieldLife, isControlled, health, vx, vy, nearBase, threatFor)
        case HEROES :
            return new MyHero(id, x, y, new Position(-1, -1), new Position(-1, -1),new Position(-1, -1), shieldLife, isControlled, health, vx, vy, nearBase, threatFor,true)
        case HEROESENNEMY :
            return new OpposedHero(id, x, y, shieldLife, isControlled, health, vx, vy, nearBase, threatFor)
        default:
            throw Error("Type " + type + " is unknow")
    }
}

function getMonsters(entities: Entity[]) {
    return entities.filter(entity => entity.type === MONSTERS);
}

function getMonsterInAggroZone(entities: Entity[], hero: MyHero): Entity[] {
    return getMonsters(entities).filter(monster => vectorSizeMonsterHero(hero, monster) < localDistanceFocus)
}
function getMonsterInWindZone(entities: Entity[], hero: MyHero): Entity[] {
    return getMonsters(entities).filter(monster => vectorSizeMonsterHero(hero, monster) < 1280 && monster.shieldLife == 0)
}

function getMonsterControlled(entities: Entity[]): Entity[] {
    return getMonsters(entities).filter(monster => monster.isControlled == 1)
}

function getOpposed(entities: Entity[]) {
    return entities.filter(entity => entity.type === MONSTERS || entity.type === HEROESENNEMY);
}

function getHeroes(): MyHero[] {
    return Array.from(heroes.values());
}

function getHeroesDefWithoutShield(heros ?: Entity[]): MyHero[] {
    heros = heros != null ? heros : Array.from(heroes.values())
    // @ts-ignore
    return heros.filter(hero => hero instanceof MyHero && hero.shieldLife == 0);
}

function checkFocusMonsterClosest(monster: Monster) {
    return monster != null && monster.isControlled == 0 || (monster.isControlled == 1 && monster.threatFor == 1)
}

function getControlledHeroes(): MyHero[] {
    return Array.from(heroes.values()).filter(hero => hero.isControlled == 1);
}

function getOpposedHeroes(entities: Entity[]) {
    return entities.filter(entity => entity.type === HEROESENNEMY);
}

function getEntityById(entities: Entity[], id: number): Entity {
    if (id == null) throw Error(" id is null ")
    let result = entities.filter(entity => entity.id == id);
    if (result.length == 0) throw Error("result not found")
    return result[0];
}

function getOtherHero(heroes: Map<number, MyHero>, currentId: number): MyHero[] {
    let result = Array.from(heroes.values()).filter(entity => entity.id != currentId);
    if (result.length == 0) throw Error()
    return result;
}

function getMonsterBaseClosestNotFocused(current: Entity, entities: Entity[], heros: Map<number, MyHero>): Entity | null | undefined{
    let monsters = sortProximityBase(getMonsters(entities))

    // @ts-ignore
    let idFocus: number[] = Array.from(heros.values()).filter(hero =>hero.targetId != null &&  vectorSizeMonsterHero(hero, hero.targetId)< heroZone && hero.id != current.id && hero.additionnalType != HEROTYPE.att).map(hero => hero.targetId.id)

    let result = monsters.filter(monster => (!idFocus.includes(monster.id) || vectorSizeEntityBase(monster) <2000));

    if (result.length == 0) return null

    return result[0]
}

function getHeroesByType(additionalType: string) {
    let result = Array.from(heroes.values()).filter(entity => entity.additionnalType != additionalType);
    if (result.length == 0) throw Error()
    return result;
}

function isInOpposedBase(entity: Entity | null | undefined) {
    if(entity == null) return false
    //log(" TEST "+ vectorSizeOpposedBase(entity))
   return vectorSizeOpposedBase(entity) < 5000
}

function isInMyZone(entity: MyHero) {
    if(entity.additionnalType === HEROTYPE.def && vectorSizeHeroPosition(entity,entity.defPosition) < heroZone) return true;
    else if(entity.additionnalType === HEROTYPE.explore && vectorSizeHeroPosition(entity,entity.explorePosition) < heroZone) return true;
    else if(entity.additionnalType === HEROTYPE.att && vectorSizeHeroPosition(entity,entity.attPosition) < heroZone) return true;
    else return false;
}
function opposedIsInMyZone(entity: MyHero,opposed : Entity) : boolean {

    if(entity.additionnalType === HEROTYPE.def && (vectorSizeHeroPosition(opposed,entity.defPosition) < heroZone || vectorSizeEntityBase(opposed) < baseSize)) return true;
    else if(entity.additionnalType === HEROTYPE.explore && vectorSizeHeroPosition(opposed,entity.explorePosition) < heroZone) return true;
    else return entity.additionnalType === HEROTYPE.att && vectorSizeHeroPosition(opposed, entity.attPosition) < heroZone;
}

function zonePositionFactory(heroes : Map<number, MyHero>)  {
    let index = 0;
    heroes.forEach(hero=>{
        if(hero.explorePosition.x == -1) {
            hero.explorePosition = new Position(farmZones[index].x,farmZones[index].y)
            heroes.set(hero.id,hero)
        }
        if(hero.defPosition.x == -1) {
            hero.defPosition = new Position(defZones[index].x,defZones[index].y)
            heroes.set(hero.id,hero)
        }
        if(hero.attPosition.x == -1) {
            hero.attPosition = new Position(attZones[index].x,attZones[index].y)
            heroes.set(hero.id,hero)
        }
        index++
        if(hero.additionnalType === HEROTYPE.explore && myMana < attManaDown && turn > turnChangeStrat){
            if(baseX == 0) hero.explorePosition = new Position(11000,5500)
            else hero.explorePosition = new Position(6000,2500)
            heroes.set(hero.id,hero)
        }
    })
}


//FOCUS METHOD
function excludeFocus(entities: Map<number, MyHero>, currentHero: MyHero): number[] {
    //if(currentHero.targetId == null && currentHero.additionnalType === HEROTYPE.def) return []
    let otherHeroes: MyHero[] = getOtherHero(entities, currentHero.id)
    // @ts-ignore
    return otherHeroes.filter(hero => hero.targetId != null).map(hero => hero.targetId.id);
}

function getDefMonsterFocus(entities: Entity[], currentHero: MyHero) : Entity | undefined | null {
    try {
        if (currentHero.targetId == null) throw Error("Target not define")
        return getEntityById(entities, currentHero.targetId.id)
    } catch (e) {

        let entity: Entity | null = null;
        entities.forEach(monster => {
            if (opposedIsInMyZone(currentHero, monster) && monster.isControlled == 0 || (monster.isControlled == 1 && monster.threatFor == 1)) {
                if (turn > turnChangeStrat || !excludeFocus(heroes, currentHero).includes(monster.id)) {
                    if (entity == null) entity = monster
                    if (vectorSizeMonsterHero(currentHero, monster) < vectorSizeMonsterHero(currentHero, entity)) entity = monster
                }
            }
        })
        if (entity == null) return entities[0];
        return entity
    }
}
function defaultFocusForMonsterShield(entities: Entity[], currentHero: MyHero){
    try {
        if (currentHero.targetId == null) throw Error("Target not define")
        return getEntityById(entities, currentHero.targetId.id)
    } catch (e) {

        let entity: Entity | null = null;
        entities.forEach(monster => {
            if (monster.threatFor == 2 && monster.shieldLife ==0 && entity == null) entity = monster
        })
        if (entity == null) return entities[0];
        return entity
    }
}

function getMonsterBaseFocus(entities: Entity[]): Entity[] {
    let monsters = getMonsters(entities);

    return sortProximityBase(monsters.filter(monster => {
        let vectorSize = vectorSizeEntityBase(monster);

        //log("MONSTER ID "+monster.id+" FOCUS "+monster.threatFor+" VECTOR SIZE "+vectorSize)

        if (monster.threatFor == 1 && vectorSize < monsterBaseFocusDistance)
            return monster;

    }))
}

function getMonsterOpposedBaseFocusWithoutShield(entities: Entity[]): Entity[] {
    let monsters = getMonsters(entities);

    return sortProximityBase(monsters.filter(monster => {
        let vectorSize = vectorSizeOpposedBase(monster);

        //log("MONSTER ID "+monster.id+" FOCUS "+monster.threatFor+" VECTOR SIZE "+vectorSize)

        if (monster.threatFor == 2 && vectorSize < monsterBaseFocusDistance && monster.shieldLife == 0)
            return monster;

    }))
}
function getMonsterOpposedBaseFocus(entities: Entity[]): Entity[] {
    let monsters = getMonsters(entities);

    return sortProximityBase(monsters.filter(monster => {
        let vectorSize = vectorSizeOpposedBase(monster);

        //log("MONSTER ID "+monster.id+" FOCUS "+monster.threatFor+" VECTOR SIZE "+vectorSize)

        if (monster.threatFor == 2 && vectorSize < monsterBaseFocusDistance)
            return monster;

    }))
}


//SORT
function sortProximityBase<T extends Entity>(entities: T[]) {
    return entities.sort((a, b) => vectorSizeEntityBase(a) - vectorSizeEntityBase(b))
}

function sortProximityEntity(entities: Entity[], entity: Entity) {
    return entities.sort((a, b) => vectorSizeMonsterHero(entity, a) - vectorSizeMonsterHero(entity, b))
}

function sortOrderPriority(orders: Order[]) {
    return orders.sort((a, b) => a.priority - b.priority)
}


//UTIL
function rand(min: number, max: number, axys: string) {
    if (axys !== 'x' && axys !== 'y') return 0;
    if (min < 0) min = 0;
    if (axys === 'x' && max > maxX) max = maxX;
    if (axys === 'y' && max > maxY) max = maxY;

    return min + Math.floor(Math.random() * (max - min));
}

function getMax(v1: number, v2: number) {
    return v1 > v2 ? v1 : v2
}

function getMin(v1: number, v2: number) {
    return v1 < v2 ? v1 : v2
}

function vectorSizeMonsterHero(hero: Entity, monster: Entity | undefined | null): number {
    if(monster == null || monster.x == null) return 99999
    return Number(Math.sqrt(Math.pow(monster.x - hero.x, 2) + Math.pow(monster.y - hero.y, 2)).toFixed(0))
}
function vectorSizeHeroPosition(hero: Entity, position: Position | undefined | null): number {
    if(position == null || position.x == null) return 99999
    return Number(Math.sqrt(Math.pow(position.x - hero.x, 2) + Math.pow(position.y - hero.y, 2)).toFixed(0))
}

function vectorSizeEntityBase(monster: Entity | undefined | null): number {
    if(monster == null || monster.x == null) return 99999
    return Number(Math.sqrt(Math.pow(monster.x - baseX, 2) + Math.pow(monster.y - baseY, 2)).toFixed(0))
}

function vectorSizeOpposedBase(monster: Entity): number {
    if(monster == null || monster.x == null) return 99999
    let x = baseX == 0 ? maxX : 0;
    let y = baseX == 0 ? maxY : 0;
    return Number(Math.sqrt(Math.pow(monster.x - x, 2) + Math.pow(monster.y - y, 2)).toFixed(0))
}

function log(value: string) {
    console.error(value)
}


//MOVE
function move(x: number, y: number, currentId: number, targetId: number) {
    if (!checkHeroes(currentId, targetId)) return;
    //log("HERO "+currentId+" x "+x+" y "+y)
    console.log('MOVE ' + ~~x + ' ' + ~~y);
}

function moveRand(entity: MyHero) {
    if(entity.additionnalType == HEROTYPE.def) move(rand(entity.defPosition.x-heroZone,entity.defPosition.x+heroZone, 'x'),rand(entity.defPosition.y-heroZone,entity.defPosition.y+heroZone, 'y'), entity.id, entity.id)
    if(entity.additionnalType == HEROTYPE.explore) move(rand(entity.explorePosition.x-heroZone,entity.explorePosition.x+heroZone, 'x'),rand(entity.explorePosition.y-heroZone,entity.explorePosition.y+heroZone, 'y'), entity.id, entity.id)
    if(entity.additionnalType == HEROTYPE.att) move(rand(entity.attPosition.x-heroZone,entity.attPosition.x+heroZone, 'x'),rand(entity.attPosition.y-heroZone,entity.attPosition.y+heroZone, 'y'), entity.id, entity.id)

}
function movePatrol(entity: MyHero) {
    let position = new Position(0,0)
    log("+++++++++++POSITION x "+position.x+" VECTOR "+vectorSizeHeroPosition(entity,position)+" VALUE "+entity.leftObjectivePatrol+"+++++++++++++++++")

    if(baseX == 0 ){
        if(entity.leftObjectivePatrol){
            position = new Position(16000,3000)
        }else {
            position = new Position(11000,8000)

        }
    }else {
        if(entity.leftObjectivePatrol){
            position = new Position(6000,1000)
        }else {
            position = new Position(1000,6000)
        }
    }
    if(position.x == entity.x && position.y == entity.y){
        entity.leftObjectivePatrol = !entity.leftObjectivePatrol
        heroes.set(entity.id,entity)
        log("TOTO OI")
    }
    log("+++++++++++POSITION x "+position.x+" VECTOR "+vectorSizeHeroPosition(entity,position)+" VALUE "+entity.leftObjectivePatrol+"+++++++++++++++++")
    move(position.x,position.y,entity.id,entity.id)
}

//SPELL
function canUseASort(sort: string, target: Entity | undefined | null, hero: MyHero) {
    if(target == null) return false;
    if(turn < turnChangeStrat) return false;
    /*log("TARGET HERO ID"+hero.id+" SPELL ID "+target.id+" TYPE "+target.type+" ISCONTROLLED "+(target.isControlled == 0  &&
       vectorSizeMonsterHero(hero, target) < 2200 &&
       vectorSizeMonsterHero(hero, target) > 900 &&

       myMana > 30)+"SORT "+sort+" TYPE HERO "+hero.additionnalType)*/

    if (sort === SHIELD && target.type == HEROES)

        return vectorSizeMonsterHero(hero, target) < 2200 &&
            myMana > manaUsed;
    else if (sort === SHIELD && target.type == MONSTERS){
        //log("TARGET HERO ID"+hero.id+" SPELL ID "+target.id+" TYPE "+target.type+" threatfor "+target.threatFor+" DISTANCE BASE "+vectorSizeEntityBase(target))

        return vectorSizeMonsterHero(hero, target) < 2200 &&
            myMana > manaUsed &&
            (target.health > 12 ||  vectorSizeOpposedBase(target) < 3000) &&
            target.threatFor == 2 &&
            target.shieldLife == 0 &&
            vectorSizeEntityBase(target) > 8000 &&
            vectorSizeOpposedBase(target) < 8000;

    }else if (sort === CONTROL && target.type == MONSTERS)

        return (target.isControlled == 0 || target.threatFor == 1) &&
            target.health > minLifeMonster &&
            target.threatFor != 2 &&
            vectorSizeMonsterHero(hero, target) < 2200 &&
          //  vectorSizeMonsterHero(hero, target) > 900 &&
            vectorSizeEntityBase(target) > 4000 &&
            myMana > manaUsed

    else if (sort === CONTROL && target.type == HEROESENNEMY)
        return target.isControlled == 0  &&
            vectorSizeMonsterHero(hero, target) < 2200 &&
            myMana > manaUsed

    else if (sort === WIND) return target.shieldLife == 0 && myMana > manaUsed && vectorSizeMonsterHero(hero, target) < 1280

    else return false;
}

function useWind(hero: Entity) {
    baseX == 0 && console.log('SPELL WIND ' + (hero.x + 1000) + ' ' + (hero.y + 1000));
    baseX != 0 && console.log('SPELL WIND ' + (hero.x - 1000) + ' ' + (hero.y - 1000));
}

function useControl(opposedEntity: Entity | null | undefined) {
    if (opposedEntity == null) throw Error("Opposed Entity not found")
    if (opposedEntity.type == MONSTERS) {
        if (baseX == 0) {
            console.log('SPELL CONTROL ' + opposedEntity.id + ' ' + (maxX) + ' ' + (maxY));
        } else {
            console.log('SPELL CONTROL ' + opposedEntity.id + ' ' + 0 + ' ' + 0);
        }
    } else if (opposedEntity.type == HEROESENNEMY) {
        if (baseX == 0) {
            console.log('SPELL CONTROL ' + opposedEntity.id + ' ' + (maxX) + ' ' + 0);
        } else {
            console.log('SPELL CONTROL ' + opposedEntity.id + ' ' + 0 + ' ' + maxY);
        }
    } else {
        throw Error("Invalid entity")
    }
}

function useShield(entity: Entity | null | undefined) {
    if (entity == null) throw Error("Entity not found")

    console.log('SPELL SHIELD ' + entity.id);
}

//CHECK

function checkHeroes(currentId: number, targetId: number) {
    return currentId == targetId;
}
function checkIfHeroesHasBetterPositionOfMe(current:MyHero,target:Entity){
    let currentVector = vectorSizeMonsterHero(current, target)
    let result = false;

    heroes.forEach(hero=>{
        if(vectorSizeMonsterHero(hero, target)<currentVector) result = true
    })

    return result
}

function checkHeroTypes(hero: MyHero, types: string[]) {
    if (hero.additionnalType == null) return false
    return types.includes(hero.additionnalType)
}




