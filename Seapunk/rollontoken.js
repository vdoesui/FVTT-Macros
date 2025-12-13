if (canvas.tokens.controlled.length === 0) {
  ui.notifications.warn("Please select a token.");
} else {
  const actor = canvas.tokens.controlled[0].actor;
  const getVal = (path) => { const v = getProperty(actor.system.attributes, path); return Number(v) || 0; };

  const val_int = getVal('int.value');
  const val_vol = getVal('vol.value');
  const val_fue = getVal('fue.value');
  const val_din = getVal('din.value');
  const val_sue = getVal('sue.value');

  const val_fis = getVal('dom.fis.value');
  const val_bat = getVal('dom.bat.value');
  const val_amb = getVal('dom.amb.value');
  const val_ddem = getVal('dom.ddem.value');
  const val_rec = getVal('dom.rec.value');
  const val_ocu = getVal('dom.ocu.value');
  const val_tec = getVal('dom.tec.value');
  const val_soc = getVal('dom.soc.value');
  const val_con = getVal('dom.con.value');
  const val_aur = getVal('dom.aur.value');

  const val_atq = getVal('param.atq.value');
  const val_def = getVal('param.def.value');
  const val_imp = getVal('param.imp.value');
  const val_resfis = getVal('param.resfis.value');
  const val_resmen = getVal('param.resmen.value');

  let applyChanges = false;
  new Dialog({
    title: `Tirar dados`,
    content: `
<form>
  <style>
    .dialog { width: 920px !important; max-width: calc(100vw - 48px) !important; }

    .myButton {
      display:flex;
      align-items:stretch;
      justify-content:flex-start;
      gap:6px;
      padding:0.36rem 10px;
      font-size:0.9rem;
      box-sizing:border-box;
      background-color: var(--color-cool-4);
      color: var(--cp-font-light);
      border:1px solid var(--cp-font-light);
      text-transform:uppercase;
      cursor:pointer;
      white-space:normal;
      word-break:break-word;
      line-height:1.18;
      min-width:40px;
      height:auto;
      overflow:visible;
    }
    .myButton:hover { background-color: var(--color-text-hyperlink); color: var(--cp-font-dark) !important; font-weight:700; }

    .selectedDice, .selectedAttr, .selectedSkill, .selectedParam {
      background-color: var(--color-text-hyperlink);
      color: var(--cp-font-dark) !important;
      font-weight: bold;
    }

    h2 { margin:4px 0 6px 0; font-size:0.92rem; line-height:1; }
    .layout { display:flex; gap:10px; align-items:flex-start; flex-wrap:nowrap; }
    .left-col { display:flex; flex-direction:column; gap:8px; width:66%; min-width:360px; }
    .right-col { display:flex; flex-direction:column; gap:8px; width:34%; min-width:220px; }
    .grid-inline { display:grid; gap:6px; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); align-items:center; }
    .grid-inline-2 { display:grid; gap:6px; grid-template-columns: repeat(2, minmax(80px, 1fr)); align-items:center; }
    .domain-grid { display:grid; gap:6px; grid-template-columns: repeat(5, minmax(72px, 1fr)); grid-auto-rows: minmax(28px, auto); }
    .dice-row { display:flex; gap:6px; flex-wrap:nowrap; align-items:center; }
    #modifier-block { margin-bottom:20px; }
    input[type="text"] { font-size:0.95rem; padding:6px; width:100%; box-sizing:border-box; }
    input[type="hidden"] { display:none; }

    .btn-inner { display:flex; align-items:center; justify-content:flex-start; width:100%; gap:6px; }
    .btn-label {
      flex: 1 1 auto;
      min-width: 0;
      line-height:1.18;
      vertical-align:middle;
      text-transform:none;
      font-weight:600;
      font-size:0.95rem;
      overflow-wrap:break-word;
    }
    .btn-value {
      flex: 0 0 auto;
      margin-left:6px;
      font-size:0.85rem;
      opacity:0.92;
      text-transform:none;
      white-space:nowrap;
    }
  </style>

  <script>
    function activateDice(element, diceValue) {
      var buttons = document.getElementsByClassName("diceButton");
      for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove("selectedDice");
      element.classList.add("selectedDice");
      document.getElementById('dice').value = diceValue;
    }

    function selectAttribute(element, value) {
      var buttons = document.getElementsByClassName("attrButton");
      for (var i=0;i<buttons.length;i++) buttons[i].classList.remove("selectedAttr");
      element.classList.add("selectedAttr");
      document.getElementById('attribute').value = value;
      document.getElementById('parameter').value = '';
      var pbuttons = document.getElementsByClassName("paramButton");
      for (var j=0;j<pbuttons.length;j++) pbuttons[j].classList.remove("selectedParam");
    }

    function selectSkill(element, value) {
      var buttons = document.getElementsByClassName("skillButton");
      for (var i=0;i<buttons.length;i++) buttons[i].classList.remove("selectedSkill");
      element.classList.add("selectedSkill");
      document.getElementById('skill').value = value;
      document.getElementById('parameter').value = '';
      var pbuttons = document.getElementsByClassName("paramButton");
      for (var j=0;j<pbuttons.length;j++) pbuttons[j].classList.remove("selectedParam");
    }

    function selectParameter(element, value) {
      var pbuttons = document.getElementsByClassName("paramButton");
      for (var i=0;i<pbuttons.length;i++) pbuttons[i].classList.remove("selectedParam");
      element.classList.add("selectedParam");
      document.getElementById('parameter').value = value;
      document.getElementById('attribute').value = '';
      document.getElementById('skill').value = '';
      var attrButtons = document.getElementsByClassName("attrButton");
      for (var j=0;j<attrButtons.length;j++) attrButtons[j].classList.remove("selectedAttr");
      var skillButtons = document.getElementsByClassName("skillButton");
      for (var k=0;k<skillButtons.length;k++) skillButtons[k].classList.remove("selectedSkill");
    }
  </script>

  <div style="display:flex; flex-direction:column; gap:8px;">
    <div>
      <h2>Cantidad de d6:</h2>
      <input type="hidden" id="dice" name="dice" value="2d6">
      <div class="dice-row">
        <button type="button" class="myButton diceButton" onclick="activateDice(this,'1d6')"><span class="btn-inner"><span class="btn-label">1</span></span></button>
        <button type="button" class="myButton diceButton selectedDice" onclick="activateDice(this,'2d6')"><span class="btn-inner"><span class="btn-label">2</span></span></button>
        <button type="button" class="myButton diceButton" onclick="activateDice(this,'3d6')"><span class="btn-inner"><span class="btn-label">3</span></span></button>
        <button type="button" class="myButton diceButton" onclick="activateDice(this,'4d6')"><span class="btn-inner"><span class="btn-label">4</span></span></button>
        <button type="button" class="myButton diceButton" onclick="activateDice(this,'5d6')"><span class="btn-inner"><span class="btn-label">5</span></span></button>
      </div>
    </div>

    <div class="layout">
      <div class="left-col">
        <div>
          <h2>Atributo:</h2>
          <input type="hidden" id="attribute" name="attribute" value="sue.value">
          <div class="grid-inline" style="margin-top:4px;">
            <button type="button" class="myButton attrButton" onclick="selectAttribute(this,'int.value')"><span class="btn-inner"><span class="btn-label">Int</span><span class="btn-value">(${val_int})</span></span></button>
            <button type="button" class="myButton attrButton" onclick="selectAttribute(this,'vol.value')"><span class="btn-inner"><span class="btn-label">Vol</span><span class="btn-value">(${val_vol})</span></span></button>
            <button type="button" class="myButton attrButton" onclick="selectAttribute(this,'fue.value')"><span class="btn-inner"><span class="btn-label">Fue</span><span class="btn-value">(${val_fue})</span></span></button>
            <button type="button" class="myButton attrButton" onclick="selectAttribute(this,'din.value')"><span class="btn-inner"><span class="btn-label">Din</span><span class="btn-value">(${val_din})</span></span></button>
            <button type="button" class="myButton attrButton selectedAttr" onclick="selectAttribute(this,'sue.value')"><span class="btn-inner"><span class="btn-label">Sue</span><span class="btn-value">(${val_sue})</span></span></button>
          </div>
        </div>

        <div>
          <h2>Dominio:</h2>
          <input type="hidden" id="skill" name="skill" value="dom.cib.value">
          <div class="domain-grid" style="margin-top:4px;">
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.fis.value')"><span class="btn-inner"><span class="btn-label">Fisico</span><span class="btn-value">(${val_fis})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.bat.value')"><span class="btn-inner"><span class="btn-label">Batalla</span><span class="btn-value">(${val_bat})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.amb.value')"><span class="btn-inner"><span class="btn-label">Ambiental</span><span class="btn-value">(${val_amb})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.ddem.value')"><span class="btn-inner"><span class="btn-label">Demoniaco</span><span class="btn-value">(${val_ddem})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.rec.value')"><span class="btn-inner"><span class="btn-label">Recursos</span><span class="btn-value">(${val_rec})</span></span></button>

            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.ocu.value')"><span class="btn-inner"><span class="btn-label">Oculto</span><span class="btn-value">(${val_ocu})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.tec.value')"><span class="btn-inner"><span class="btn-label">Tecnico</span><span class="btn-value">(${val_tec})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.soc.value')"><span class="btn-inner"><span class="btn-label">Social</span><span class="btn-value">(${val_soc})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.con.value')"><span class="btn-inner"><span class="btn-label">Conocimiento</span><span class="btn-value">(${val_con})</span></span></button>
            <button type="button" class="myButton skillButton" onclick="selectSkill(this,'dom.aur.value')"><span class="btn-inner"><span class="btn-label">Aura</span><span class="btn-value">(${val_aur})</span></span></button>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div>
          <h2>Parámetros:</h2>
          <input type="hidden" id="parameter" name="parameter" value="">
          <div class="grid-inline-2" style="margin-top:4px;">
            <button type="button" class="myButton paramButton" onclick="selectParameter(this,'param.atq.value')"><span class="btn-inner"><span class="btn-label">Ataque</span><span class="btn-value">(${val_atq})</span></span></button>
            <button type="button" class="myButton paramButton" onclick="selectParameter(this,'param.def.value')"><span class="btn-inner"><span class="btn-label">Defensa</span><span class="btn-value">(${val_def})</span></span></button>
            <button type="button" class="myButton paramButton" onclick="selectParameter(this,'param.imp.value')"><span class="btn-inner"><span class="btn-label">Impacto</span><span class="btn-value">(${val_imp})</span></span></button>
            <button type="button" class="myButton paramButton" onclick="selectParameter(this,'param.resfis.value')"><span class="btn-inner"><span class="btn-label">Resistencia Física</span><span class="btn-value">(${val_resfis})</span></span></button>
            <button type="button" class="myButton paramButton" onclick="selectParameter(this,'param.resmen.value')"><span class="btn-inner"><span class="btn-label">Resistencia Mental</span><span class="btn-value">(${val_resmen})</span></span></button>
          </div>
        </div>
      </div>
    </div>

    <div id="modifier-block">
      <h2>Modificador:</h2>
      <input id="customNumber" name="customNumber" type="text" value="0" />
    </div>
  </div>
</form>
      `,
    buttons: {
      yes: { icon: "<i class='fas fa-check'></i>", label: `Tirar`, callback: () => applyChanges = true },
      no:  { icon: "<i class='fas fa-times'></i>", label: `Cancelar` }
    },
    default: "yes",
    close: html => {
      if (applyChanges) {
        (async () => {
          let dice = html.find('[name=dice]')[0].value;
          let kattribute = html.find('[name=attribute]')[0].value || '';
          let kskill = html.find('[name=skill]')[0].value || '';
          let kparameter = html.find('[name=parameter]')[0].value || '';
          let kcustomNumber = html.find('[name=customNumber]')[0].value;
          let actor = canvas.tokens.controlled[0].actor;

          let attribute = 0;
          let skill = 0;
          let parameter = 0;

          if (kparameter) {
            let paramVal = getProperty(actor.system.attributes, kparameter);
            parameter = Number(paramVal) || 0;
          } else {
            if (kattribute) {
              let attributeb = getProperty(actor.system.attributes, kattribute);
              attribute = Number(attributeb) || 0;
            }
            if (kskill) {
              let skillb = getProperty(actor.system.attributes, kskill);
              skill = Number(skillb) || 0;
            }
          }

          let customNumber = Number(kcustomNumber) || 0;
          let rollFormula = kparameter
            ? `${dice} + ${parameter} + ${customNumber}`
            : `${dice} + ${attribute} + ${skill} + ${customNumber}`;

          let roll = new Roll(rollFormula);
          await roll.roll();
          roll.toMessage();
        })();
      }
    }
  }).render(true);
}