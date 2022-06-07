const profileinfo = document.getElementById("profileinfo");
const editform = document.getElementById("editprofile");
const updatebutton = document.getElementById("updateinfo");
const editbutton = document.getElementById("edit");

editbutton.addEventListener("click", function () {
    profileinfo.classList.add("hide");
    editform.classList.remove("hide");
});

updatebutton.addEventListener("click", function () {
    profileinfo.classList.remove("hide");
    editform.classList.add("hide");
});
