/* global chrome $ */

/* eslint-disable no-undef */
const helpers = {
  logAction,
};
/* eslint-enable no-undef */

const numTemplates = 10;

// Saves options to chrome.storage
function save_options(evt) {
  var tempsRA = getTemplateList();
  chrome.storage.sync.set({
    "temps": tempsRA
  }, function () {
    // Update status to let user know options were saved.
    var butnum = evt.target.number;
    var button = document.getElementsByClassName("save")[butnum];
    button.setAttribute("class", "btn btn-sm btn-success save");
    var status = document.getElementsByClassName("status")[butnum];
    status.textContent = "Options saved.";
    setTimeout(function () {
      status.textContent = "";
      button.setAttribute("class", "btn btn-sm btn-primary save");
    }, 2000);
    helpers.logAction(`Saved template ${butnum + 1}`);
  });
}

function import_templates(fileInput) {
  var file = fileInput.files[0];
  var textType = /text.*/;
  if (file.type.match(textType)) {
    var reader = new FileReader();
    reader.onload = function () {
      var lines = this.result.split("\n");
      var list = [];
      list.push("");
      var templateCount = 1;
      for (var line = 0; line < lines.length; line++) {
        var currLine = lines[line];
        if (currLine != "---donotremovethis---") {
          list[templateCount - 1] += currLine + "\n";
        } else if (templateCount <= numTemplates) {
          list[templateCount - 1] = list[templateCount - 1].trim();
          list.push("");
          templateCount++;
        } else {
          break;
        }
      }
      chrome.storage.sync.set({
        "temps": list
      }, function () {
        location.reload();
      });
    };
    reader.readAsText(file);
  }
  helpers.logAction("Imported templates");
}

function export_templates() {
  const sep = "\n---donotremovethis---\n";
  const content = getTemplateList().join(sep) + sep;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url, // The object URL can be used as download URL
    filename: "linkedin_templater_backup.txt"
  });
  helpers.logAction("Exported templates");
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get("temps", function (items) {
    var tempsRA = items.temps || [];
    for (var i = 1; i <= tempsRA.length; i++) {
      document.getElementById("temp" + i)
        .value = tempsRA[i - 1];
    }
    document.getElementsByClassName("save")[0].click();
  });

  var fileInput = document.getElementById("import");
  fileInput.addEventListener("change", function () {
    import_templates(this);
  });
  $("#export").click(export_templates);
  $("#tellus").click(() => {
    const templaterChromePage = "https://chrome.google.com/webstore/detail/linkedin-templater/jfhnijpfdeddconibjjjmlboahkiback/reviews";
    chrome.tabs.create({active: true, url: templaterChromePage});
  });
}

function getTemplateList() {
  var temps = document.getElementsByClassName("temp");
  var list = [];
  for (var i = 0; i < temps.length; i++) {
    list.push(temps.item(i).value);
  }
  return list;
}

const insertButtonIds = [
  "fn", // First name
  "ln", // Last name
  "cn", // Company name
];

function createPage() {
  var contain = document.getElementById("templater");
  // Clone save button
  var savebtn = document.getElementById("save").cloneNode(true);
  savebtn.removeAttribute("id");
  document.getElementById("save").remove();
  const insertButtonsElems = $.map(insertButtonIds, (insertButtonId) => {
    const insertBtn = document.getElementById(insertButtonId).cloneNode(true);
    insertBtn.removeAttribute("id");
    document.getElementById(insertButtonId).remove();
    return insertBtn;
  });
  // Copy separator
  var separator = document.getElementById("sep").cloneNode(true);
  separator.removeAttribute("id");
  // Copy status message
  var status = document.getElementById("status").cloneNode(true);
  // status.removeAttribute("id");
  // document.getElementById("status").remove();
  for (var i = 1; i <= numTemplates; i++) {
    var ppri = document.createElement("div");
    ppri.setAttribute("class", "panel panel-primary");
    var phead = document.createElement("div");
    phead.setAttribute("class", "panel-heading");
    var h5 = document.createElement("h5");
    h5.setAttribute("class", "panel-title");
    h5.innerHTML = "Template " + i;
    phead.appendChild(h5);
    ppri.appendChild(phead);
    var pbody = document.createElement("div");
    pbody.setAttribute("class", "panel-body");
    var tempText = document.createElement("textarea");
    tempText.setAttribute("class", "form-control temp");
    tempText.setAttribute("id", "temp" + i);
    tempText.setAttribute("maxlength", "299");
    tempText.setAttribute("rows", "9");
    tempText.setAttribute("cols", "100");
    tempText.setAttribute("style", "width: 600px !important;");
    tempText.value = "Hello [fn] [ln],\n"
      + "I see that you work at [cn].\n"
      + "I'd like to add you to my professional network on LinkedIn.";
    pbody.appendChild(tempText);
    pbody.appendChild(savebtn.cloneNode(true));
    $.each(insertButtonsElems, (i, insertBtn) => {
      pbody.appendChild(insertBtn.cloneNode(true));
    });
    pbody.appendChild(status.cloneNode(true));
    pbody.appendChild(separator.cloneNode(true));
    ppri.appendChild(pbody);
    contain.appendChild(ppri);
  }

  const saveRA = document.getElementsByClassName("save");
  const fnbtnRA = document.getElementsByClassName("fnbtn");
  const lnbtnRA = document.getElementsByClassName("lnbtn");
  const cnbtnRA = document.getElementsByClassName("cnbtn");
  for (var butnum = 0; butnum < numTemplates; butnum++) {
    saveRA[butnum].addEventListener("click", save_options, false);
    saveRA[butnum].number = butnum;
    const tempText = document.getElementById(`temp${butnum + 1}`);
    $(fnbtnRA[butnum]).on("click", () => {
      tempText.value = tempText.value + "[fn]";
    });
    $(lnbtnRA[butnum]).on("click", () => {
      tempText.value = tempText.value + "[ln]";
    });
    $(cnbtnRA[butnum]).on("click", () => {
      tempText.value = tempText.value + "[cn]";
    });
  }
  $("#templater").css("overflow-y", "scroll");
  if (chrome.extension.getViews({ type: "popup" }).length > 0) {
    $("#templater").height($("#templater").children().height() * 150 / 100);
  } else {
    $("#templater").height($("#templater").children().height() * 100 / 100);
  }
}

createPage();
document.addEventListener("DOMContentLoaded", restore_options);

/* eslint-disable */

// Google Analytics
(function (i, s, o, g, r, a, m) {
i["GoogleAnalyticsObject"] = r; i[r] = i[r] || function () {
  (i[r].q = i[r].q || []).push(arguments);
}, i[r].l = 1 * new Date(); a = s.createElement(o),
  m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
})(window, document, "script", "https://ssl.google-analytics.com/analytics.js", "ga");

ga("create", "UA-92218971-1", "auto");
ga("send", "pageview");
