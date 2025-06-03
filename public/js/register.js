window.onload = () => {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
      }
    };