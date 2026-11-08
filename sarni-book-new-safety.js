/* SarNi Book New action safety shim — isolated, no data writes.
   The existing app remains responsible for saveBook and form submission. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function recover(){
  const backdrop=$('modalBackdrop'), modal=$('bookModal'),form=$('bookForm');
  if(!backdrop||!modal||!form)return;
  if(!modal.classList.contains('hidden'))return; // normal app handler succeeded
  form.reset();
  const bookId=$('bookId');if(bookId)bookId.value='';
  const heading=$('bookModalTitle');if(heading)heading.textContent='New book';
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden','false');
  backdrop.querySelectorAll('.modal').forEach(el=>el.classList.add('hidden'));
  modal.classList.remove('hidden');
  $('bookTitle')?.focus();
 }
 document.addEventListener('click',e=>{
  if(!e.target.closest('#addBookBtn'))return;
  // Only intervene when the normal handler has not opened the modal.
  setTimeout(recover,0);
 });
})();