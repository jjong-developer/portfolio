/**
 * firebase 객체들 불러오기
 */
import {
    dbAuth,
    onAuth,
    signOut,
    deleteUser,
    createUserWithEmailAndPassword,
    updateProfile,
    updatePassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithRedirect,
    googleProvider,
    facebookProvider,
    githubProvider,
    setPersistence,
    browserSessionPersistence,
    dbStore,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    dbStorage,
    uploadBytesResumable,
    getDownloadURL,
    ref
} from './firebase_config.js'
const siteCollectionRef = collection(dbStore, 'site')

/**
 * 전역 변수
 */
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth() + 1
const day = today.getDate()
const todayDate = year+'-'+(('00'+month.toString()).slice(-2))+'-'+(('00'+day.toString()).slice(-2))
const headerSelector = document.querySelector('.header')
const observerSelector  = document.querySelectorAll('.interface-observer')
const topBtn = document.querySelector('#topBtn')
const skillBox = document.querySelectorAll('.skill-box')
const signInOutBtn = document.querySelector('#signInOutBtn')
const nameView = document.querySelector('#nameView')
const menuList = document.querySelectorAll('.menu li')
const tabMenuCategories = document.querySelectorAll('.tab-menu-categories li')
const tabMenuContent = document.querySelectorAll('.tab-menu-content')
const resumeFilePath = 'resume/2025_김종욱_이력서.pdf'
let isUser // 로그인 여/부 상태값을 받기 위함 -> html 파일내에서 생성한 태그는 사용안하는 용도이고 script내에서 동적으로 추가한 html만 사용하기 위함
let superAdmin = ['jongwook2.kim@gmail.com'] // 관리자 권한 이메일 설정
let isSuperAdmin, isModalBg = false
let isCategories, isType
let fileUploadRef
let startPeriodData, endPeriodData, siteCategoriesData, siteTypeData, siteName, siteDescription, siteLink, siteThumbnailUrl = ''

window.addEventListener('DOMContentLoaded', () => {
    // html inline내에 onclick 함수 이벤트 연결
    window.modalClose = modalClose
    window.signInUp = signInUp
    window.signUp = signUp
    window.passwordReset = passwordReset

    resumeFileDownload()
})

/**
 * 이력서 파일 다운로드
 */
const resumeFileDownload = () => {
    const resumeDownload = document.getElementById('resumeDownload')
    const fileRef = ref(dbStorage, resumeFilePath)

    resumeDownload.addEventListener('click', (event) => {
        event.preventDefault()

        getDownloadURL(fileRef).then((url) => {
            window.open(url, '_blank')
        }).catch((error) => {
            windowPopup('이력서를 열 수 없습니다.<br>다시 시도해 주세요.<br>' + error.message)
        })
    })
}

/**
 * 공통 모달
 */
const modal = (title, contents) => {
    const modalTemplate = `
        <div id="modalBg" class="modal-bg"></div>
        <div class="modal-wrap">
            <div class="modal-close-btn">
                <button type="button" onclick="modalClose()">
                    <img src="./images/close.png" alt="닫기" />
                </button>
            </div>
            <div class="modal">
                <div class="modal-title">
                    <h2>${title}</h2>
                </div>
                <div class="modal-contents">${contents}</div>
            </div>
        </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalTemplate)

    // 모달 밖 영역 이벤트 실행
    // document.querySelector('#modalBg').addEventListener('mouseup', (event) => {
    //     modalClose()
    // })

    headerFix('modal')
}

/**
 * 모달 닫기
 */
const modalClose = () => {
    isModalBg = false

    document.querySelector('#modalBg').remove()
    document.querySelector('.modal-wrap').remove()
}

/**
 * 공통 alert, confirm창
 */
const windowPopup = (contents, cancelBtn) => {
    const popupTemplate = `
        <div id="popupBg">
            <div class="popup-wrap">
                <div class="popup">
                    <div class="popup-contents">
                        <p>${contents}</p>
                    </div>
                    <div class="popup-btn-wrap">
                        ${cancelBtn !== undefined ? cancelBtn : ''}
                        <button id="windowPopupOk" type="button">확인</button>
                    </div>
                </div>
            </div>
        </div>
    `
    document.body.insertAdjacentHTML('beforeend', popupTemplate)

    headerFix('modal')

    // alert, confirm창 취소/확인 버튼
    document.querySelector('#windowPopupCancel, #windowPopupOk').addEventListener('click', () => {
        isModalBg = false
        document.querySelector('#popupBg').remove()
    })
}

/**
 * 플로팅박스 띄워져있을때 스크롤 시 헤더부분 고정
 */
const headerFix = (type) => {
    isModalBg = true

    document.addEventListener('mousewheel', () => {
        if (type === 'menu') {
            if (document.querySelector('.menu').classList.contains('active')) {
                headerSelector.removeAttribute('id')
            }
        } else if (type === 'modal') {
            if (isModalBg && document.querySelector('#modalBg').classList.contains('modal-bg')) {
                headerSelector.removeAttribute('id')
            }
        }
    })
}

/**
 * 새로고침
 */
const reload = () => {
    window.location.reload()
}

/**
 * 이메일 정규식 체크
 */
const emailCheck = (str) => {
    let regEmail = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/

    if (!regEmail.test(str)) {
        return false
    } else {
        return true
    }
}

/**
 * 포트폴리오 사이트 등록, 수정 모달
 */
const portfolioSite = () => {
    modal(
    '프로젝트를 등록 해보세요 :)',
'<div>' +
            '<div class="modal-date-box-wrap">' +
                '<div class="modal-date-box">' +
                    '<label for="startPeriod">시작 기간: </label>' +
                    '<input id="startPeriod" type="date" name="startPeriod" max="' + todayDate + '" pattern="\d{4}/\d{2}/\d{2}" />' + // min="0000-00-00"
                '</div>' +
                '<div class="modal-date-box">' +
                    '<label for="endPeriod">종료 기간: </label>' +
                    '<input id="endPeriod" type="date" name="endPeriod" max="' + todayDate + '" pattern="\d{4}/\d{2}/\d{2}" />' +
                '</div>' +
            '</div>' +
            '<div class="modal-select-box-wrap">' +
                '<select id="siteCategories" class="modal-select-box">' +
                    '<option value="" selected="selected" disabled>분류 선택</option>' +
                    '<option value="호텔/팬션">호텔/팬션</option>' +
                    '<option value="쇼핑몰">쇼핑몰</option>' +
                    '<option value="교육/IT솔루션">교육/IT솔루션</option>' +
                    '<option value="제조장비 반도체산업">제조장비 반도체산업</option>' +
                    '<option value="기타">기타</option>' +
                '</select>' +
                '<select id="siteType" class="modal-select-box">' +
                    '<option value="" selected="selected" disabled>유형 선택</option>' +
                    '<option value="Responsive Web" title="반응형">Responsive Web</option>' +
                    '<option value="Adaptive Web" title="적응형">Adaptive Web</option>' +
                    '<option value="Hybrid App" title="하이브리드 앱">Hybrid App</option>' +
                '</select>' +
            '</div>' +
            '<input id="siteName" type="text" value="" autocomplete="off" placeholder="사이트명을(를) 입력해주세요." />' +
            '<textarea id="siteDescription" class="modal-textarea" placeholder="예시)&#13;&#10;참여 기여도 : Design(%), Publishing(%), Front(%), Back(%)&#13;&#10;사용 기술 : ~&#13;&#10;간략한 설명"></textarea>' +
            '<input id="siteLink" type="text" value="" autocomplete="off" placeholder="포트폴리오 주소을(를) 입력해주세요." />' +
            '<div class="file-box">' +
                '<input class="file-name" value="첨부파일명" disabled>' +
                '<label for="fileUploadFind">파일찾기</label>' +
                '<input id="fileUploadFind" class="file-upload-hidden" type="file">' +
            '</div>' +
        '</div>' +
        '<button id="writeBtn" class="modal-btn-type-1" type="button">등록하기</button>',
    )

    siteName = document.querySelector('#siteName')
    siteDescription = document.querySelector('#siteDescription')
    siteLink = document.querySelector('#siteLink')
}

/**
 * 첨부파일 변경 이벤트
 */
const fileChange = () => {
    let fileNameTarget = document.querySelector('.file-name')
    let fileInput = document.querySelector('#fileUploadFind')

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0] // 파일 추출

        if (file) {
            const fileType = file.type
            const fileSize = file.size
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
            const maxSize = 5 * 1024 * 1024 // 5MB = 5 * 1024 * 1024 bytes

            // 확장자 검사
            if (!allowedTypes.includes(fileType)) {
                windowPopup('jpg 또는 png 파일만 업로드할 수 있습니다.')
                fileInput.value = ''
                return
            }

            // 파일 크기 검사
            if (fileSize > maxSize) {
                windowPopup('파일 크기는 5MB 이하만 업로드할 수 있습니다.')
                fileInput.value = ''
                return
            }

            const fileName = file.name
            fileNameTarget.style.color = '#ffffff'
            fileNameTarget.value = fileName // 변경할때마다 파일명을 input에 insert

            fileUploadRef = ref(dbStorage, 'images/portfolio/' + fileName) // 저장 경로
            const uploadTask = uploadBytesResumable(fileUploadRef, file) // 업로드 시작

            uploadTask.on('state_changed', null, (error) => { // 이미지 업로드 여부
                console.error('업로드 중 실패했습니다, 잠시 후 다시 시도해주세요.\n', error.message)
            }, async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref)
                    siteThumbnailUrl = url
                } catch (error) {
                    console.error(error.message)
                }
            })
        }
    })
}

/**
 * 포트폴리오 사이트 프로젝트 기간 시작 & 종료 날짜 선택 이벤트
 */
const calendarChange = (startType, endType) => {
    let startPeriod = document.querySelector('#startPeriod')
    let endPeriod = document.querySelector('#endPeriod')

    if (startType === 'start') {
        startPeriod.addEventListener('change', (event) => {
            startPeriodData = event.target.value
        })
    }

    if (endType === 'end') {
        endPeriod.addEventListener('change', (event) => {
            endPeriodData = event.target.value
        })
    }
}

/**
 * 포트폴리오 사이트 분류 선택 이벤트
 */
const siteCategoriesChange = () => {
    let siteCategories = document.querySelector('#siteCategories')

    siteCategories.addEventListener('change', (event) => {
        let categoriesSelectValue = siteCategories.options[siteCategories.selectedIndex].value
        let siteCategoriesId = document.getElementById(event.target.id)

        for (let i = 0; i < siteCategoriesId.length; i += 1) {
            siteCategoriesId[i].removeAttribute('selected')
        }

        siteCategoriesId[siteCategoriesId.selectedIndex].setAttribute('selected', 'selected')
        isCategories = Boolean(siteCategoriesId[siteCategoriesId.selectedIndex].getAttribute('selected'))
        siteCategoriesData = categoriesSelectValue
    })
}

/**
 * 포트폴리오 사이트 유형 선택 이벤트
 */
const siteTypeChange = () => {
    let siteType = document.querySelector('#siteType')

    siteType.addEventListener('change', (event) => {
        let typeSelectValue = siteType.options[siteType.selectedIndex].value
        let siteTypeId = document.getElementById(event.target.id)

        for (let i = 0; i < siteTypeId.length; i += 1) {
            siteTypeId[i].removeAttribute('selected')
        }

        siteTypeId[siteTypeId.selectedIndex].setAttribute('selected', 'selected')
        isType = Boolean(siteTypeId[siteTypeId.selectedIndex].getAttribute('selected'))
        siteTypeData = typeSelectValue
    })
}

/**
 * 마우스 휠 이벤트
 */
document.addEventListener('mousewheel', (event) => {
    let wheelData = event.deltaY

    if (wheelData > 0) { // 휠 내릴때
        headerSelector.id = 'hideTranslate'
        // headerSelector.animate(
        //     {
        //         transform: [
        //             'translateY(0px)',
        //             'translateY(-300px)'
        //         ]
        //     },
        //     {
        //         duration: 500,
        //         fill: 'forwards',
        //         easing: 'ease'
        //     }
        // )
    } else {
        headerSelector.removeAttribute('id')
    }
})

/**
 * 모바일 메뉴
 */
document.querySelector('#mobileMenuBtn').addEventListener('click', () => {
    headerFix('menu')

    if (document.querySelector('.menu').classList.contains('active')) { // 메뉴 닫힘
        document.querySelector('.menu').classList.remove('active')
        document.querySelector('.nav .menu').style.right = '-100%'
        // menu style transition이 0.3초이므로 0.1초 빠르게 딜레이를 같게하기 위함
        setTimeout(() => {
            document.querySelector('.header').style.height = 'unset'
        }, 200)
        document.querySelector('#mobileMenuBtn').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm6 7h12v2H9v-2zm-6 7h18v2H3v-2z" fill="rgba(255,255,255,1)"/></svg>'
        document.querySelector('body').style.cssText = ''
        document.addEventListener('offscroll', (event) => {})
    } else { // 메뉴 열림
        document.querySelector('.menu').classList.add('active')
        document.querySelector('.nav .menu').style.right = '0px'
        document.querySelector('.header').style.height = '100%'
        document.querySelector('#mobileMenuBtn').innerHTML = '<svg class="close-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="rgba(255,255,255,1)"/></svg>'
        document.querySelector('body').style.cssText = 'overflow: hidden; height: 100%;'
        document.addEventListener('onscroll', (event) => {
            event.preventDefault()
            event.stopPropagation()

            return false
        })
    }
})

/**
 * 메뉴 클릭 시 해당 영역으로 이동
 */
menuList.forEach((el) => {
    el.addEventListener('click', (event) => {
        event.preventDefault()

        const menuScroll = event.currentTarget.dataset.offset
        const menuTarget = document.querySelector(menuScroll)

        if (!menuTarget) {
            return
        }

        // 옵저버 실행 중단
        isScrollClick = true

        menuList.forEach((el) => {
            el.classList.remove('active')
        })
        el.classList.add('active')

        // 모바일 메뉴 닫기
        const menuBox = document.querySelector('.menu')
        if (menuBox.classList.contains('active')) { // 메뉴 박스 닫힘
            document.querySelector('.nav .menu').style.right = '-100%'
            setTimeout(() => {
                document.querySelector('.header').style.height = 'unset'
            }, 200)
            menuBox.classList.remove('active')
            document.querySelector('#mobileMenuBtn').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm6 7h12v2H9v-2zm-6 7h18v2H3v-2z" fill="rgba(255,255,255,1)"/></svg>`
            document.body.style.cssText = ''
        }

        // 스크롤 이동
        menuTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })

        // 일정 시간 후 옵저버 재실행
        setTimeout(() => {
            isScrollClick = false
        }, 500)
    })
})

/**
 * 로그인 인증 상태
 */
onAuth((user) => {
    console.log(user)
    isUser = user

    if (user) {
        console.log("로그인 상태입니다.")

        isSuperAdmin = superAdmin.includes(user.email)

        nameView.innerHTML = `
            <span class="user-name">${user.displayName}</span>
            <span> 님, 환영합니다 :)</span>
        `

        let myInfoBox = `
            <div class="my-info-box">
                <span class="user-delete">회원 탈퇴</span>
                <span class="user-modify">정보 수정</span>
            </div>
        `

        const userNameElement = document.querySelector('.user-name')

        userNameElement.addEventListener('mouseenter', () => {
            userNameElement.insertAdjacentHTML('beforeend', myInfoBox)

            document.querySelector('.user-delete').addEventListener('click', () => {
                windowPopup('정말 회원 탈퇴하시겠습니까?', '<button id="windowPopupCancel" class="bg-danger" type="button">취소</button>')

                document.querySelector('#windowPopupOk').id = 'userDeleteBtn'
                document.querySelectorAll('#userDeleteBtn').forEach((el) => {
                    el.addEventListener('click', async () => {
                        el.closest('#popupBg').remove()

                        // 이메일 인증한 유저는 본인확인 처리 과정을 패스함 (boolean 타입)
                        if (user.emailVerified) {
                            try {
                                await deleteUser(user)
                                windowPopup('정상적으로 회원 탈퇴처리가 완료되었습니다.<br>이용해주셔서 감사합니다 :)')
                                document.querySelector('#windowPopupOk').addEventListener('click', () => {
                                    reload()
                                })
                            } catch (error) {
                                windowPopup('회원 탈퇴처리가 실패하였습니다, 잠시 후 다시 시도해주세요.<br>' + error.message)
                            }
                        }
                    })
                })
            })

            document.querySelector('.user-modify').addEventListener('click', () => {
                modal(
                    '회원 정보를 수정해주세요 :)',
                    `<div class="user-info-modify">
                        <label for="">이름</label>
                        <input type="text" name="name" value="${user.displayName}" autocomplete="off" disabled />
                        <label for="">이메일</label>
                        <input type="text" name="email" value="${user.email}" autocomplete="off" disabled placeholder="이메일을(를) 입력해주세요." />
                        <label for="">비밀번호</label>
                        <input type="password" name="password" value="" autocomplete="off" placeholder="비밀번호을(를) 입력해주세요." />
                        <label for="">비밀번호 확인</label>
                        <input type="password" name="re_password" value="" autocomplete="off" placeholder="비밀번호을(를) 한번 더 입력해주세요." />
                        <button class="modal-btn-type-1" type="button" onclick="signInUp(this)">수정하기</button>
                    </div>`
                )
            })
        })

        userNameElement.addEventListener('mouseleave', () => {
            const infoBox = document.querySelector('.my-info-box')
            if (infoBox) infoBox.remove()
        })

        signInOutBtn.textContent = 'sign out'
        signInOutBtn.addEventListener('click', async () => {
            await signOut(dbAuth)
            windowPopup('로그아웃 되었습니다.')
            document.querySelector('#windowPopupOk').addEventListener('click', () => {
                reload()
            })
        })
    } else {
        console.log("로그인 상태가 아닙니다.")

        nameView.innerHTML = '<span>게스트</span> 님, 환영합니다 :)'

        signInOutBtn.addEventListener('click', () => {
            modal(
                '로그인을 해주세요 :)',
                `<div class="switch-mode sign-auth-wrap">
                    <div class="sign-in-box">
                        <div class="email-auth-box">
                            <input type="text" name="email" value="" autocomplete="off" placeholder="이메일을(를) 입력해주세요." />
                        </div>
                        <input type="password" name="password" value="" autocomplete="off" placeholder="비밀번호을(를) 입력해주세요." />
                        <button class="sign-btn modal-btn-type-1" type="button" onclick="signInUp(this)">로그인하기</button>
                    </div>
                    <div class="sns-sign-in-box">
                        <hr>
                        <div class="sns-sign-in-info-wrap">
                            <button class="sns-sign-in-info" type="button" onclick="signInUp(this)">
                                <img src="./images/sns/google_icon.png" alt="구글 이메일로 로그인" />
                                <span>google</span>
                            </button>
                            <button class="sns-sign-in-info" type="button" onclick="signInUp(this)">
                                <img src="./images/sns/facebook_icon.png" alt="페이스북 이메일로 로그인" />
                                <span>facebook</span>
                            </button>
                            <button class="sns-sign-in-info" type="button" onclick="signInUp(this)">
                                <img src="./images/sns/kakao_icon.png" alt="카카오 이메일로 로그인" />
                                <span>kakao</span>
                            </button>
                        </div>
                    </div>
                    <div class="sign-info-box">
                        <div class="sign-info qa-member">
                            <p>아직 회원이 아니신가요?</p>
                            <button type="button" onclick="signUp(this)">일반 회원가입</button>
                        </div>
                        <div class="sign-info qa-password-find">
                            <p>비밀번호를 잊어버리셨나요?</p>
                            <button type="button" onclick="passwordReset()">재설정</button>
                        </div>
                    </div>
                </div>`
            )
        })
    }
})

/**
 * 포트폴리오 사이트 전체 리스트 랜더링
 */
let limit = 4 // 처음에 보여줄 게시물 갯수 설정
let limitAdd = 4 // 더보기 시 보여줄 게시물 갯수 설정
let moreViewTemplate = '<button id="moreViewBtn" class="btn-type-2 more-view" type="button">' + 'more view' + '</button>'
let siteNoListTemplate = '<div>게시물이 없습니다.</div>'

async function renderSiteListCategory(category, listWarpId, listContainerId) {
    const listWarp = document.querySelector(`#${listWarpId}`)
    const listContainer = document.querySelector(`#${listContainerId}`)
    let siteCount = 0

    try {
        const snapshot = await getDocs(query(siteCollectionRef, where('categoriesInfo.categories', '==', category)))

        snapshot.forEach((doc) => {
            const docData = doc.data()
            const siteListTemplate = `
                <div id="${doc.id}" class="site-list-box">
                  <img class="thumbnail" src="${docData.thumbnailUrl}" title="${docData.title}" />
                </div>
            `
            listContainer.innerHTML += siteListTemplate

            siteCount++
        })

        const siteListBox = listContainer.querySelectorAll('.site-list-box')
        const siteListBoxThumbnail = listContainer.querySelectorAll('.thumbnail')

        if (siteCount === 0) { // 총 게시물이 0개일때
            listContainer.innerHTML = siteNoListTemplate
        } else if (siteCount > limit) { // 총 게시물이 4개이상일때
            listWarp.insertAdjacentHTML('beforeend', moreViewTemplate)
        } else if (siteCount === 1) {
            siteListBox[0].style.cssText = 'width: 530px;'
            siteListBoxThumbnail[0].style.cssText = 'width: auto; height: auto; box-shadow: rgb(0 0 0 / 30%) 20px 20px 12px 0px;'
        }

        // 처음에 4개까지만 보여주기
        siteListBox.forEach((list, index) => {
            if (index >= limit) {
                list.classList.add('hidden')
            }
        })

        // 더보기
        const moreViewBtn = listWarp.querySelector('#moreViewBtn')
        if (moreViewBtn) {
            moreViewBtn.addEventListener('click', () => {
                const siteListBoxHidden = Array.from(listContainer.querySelectorAll('.site-list-box.hidden'))
                const revealCount = Math.min(limitAdd, siteListBoxHidden.length)

                for (let i = 0; i < revealCount; i++) {
                    siteListBoxHidden[i].classList.remove('hidden')
                }

                if (siteListBoxHidden.length <= limitAdd) {
                    moreViewBtn.style.display = 'none'
                }
            })
        }
    } catch (error) {
        windowPopup(`"${category}" 등록한 포트폴리오 사이트를 불러오지 못하였습니다.<br>다시 시도 해주세요.`)
    }
}

// 메인 화면에서만 실행
if (window.location.pathname === '/') {
    await renderSiteListCategory('호텔/팬션', 'hotel', 'hotelList')
    await renderSiteListCategory('쇼핑몰', 'shoppingMall', 'shoppingMallList')
    await renderSiteListCategory('교육/IT솔루션', 'solutionService', 'solutionServiceList')
    await renderSiteListCategory('제조장비 반도체산업', 'semiconductor', 'semiconductorList')
    await renderSiteListCategory('기타', 'etc', 'etcList')
}

/**
 * 포트폴리오 사이트 등록
 */
document.querySelector('#portfolioSiteWriteBtn').addEventListener('click', () => {
    portfolioSite()
    calendarChange('start', 'end')
    siteCategoriesChange()
    siteTypeChange()
    fileChange()

    document.querySelector('#writeBtn').addEventListener('click', () => {
        if (isSuperAdmin) {
            if (startPeriodData !== undefined && endPeriodData !== undefined && siteCategoriesData !== undefined
                && siteTypeData !== undefined && siteName.value !== '' && siteDescription.value !== '' && siteLink.value !== ''
                && fileUploadRef !== undefined) {
                const dataSave = {
                    projectPeriod: {
                        startPeriod: startPeriodData, // 시작 기간
                        endPeriod: endPeriodData, // 종료 기간
                    },
                    categoriesInfo: {
                        categories: siteCategoriesData, // 분류 여부
                        selected: isCategories, // 선택 여부
                    },
                    typeInfo: {
                        type: siteTypeData, // 유형 여부
                        selected: isType, // 선택 여부
                    },
                    title: siteName.value, // 사이트명
                    description: siteDescription.value.replace(/(?:\r\n|\r|\n)/g, '<br />'), // 설명
                    link: siteLink.value, // 사이트 주소
                    thumbnailUrl: siteThumbnailUrl, // 썸네일 이미지 경로
                }

                addDoc(siteCollectionRef, dataSave).then(() => {
                    windowPopup('정상적으로 등록 되었습니다.')

                    document.querySelector('#windowPopupOk').addEventListener('click', () => {
                        reload()
                    })
                }).catch((error) => {
                    windowPopup('등록에 실패하였습니다, 잠시 후 다시 시도해주세요.<br>' + error.message)
                })
            } else {
                windowPopup('모든 항목에 선택/입력 해주세요.')
            }
        } else {
            windowPopup('권한이 없습니다.<br>시스템 관리자에게 문의바랍니다.')
        }
    })
})

/**
 * 포트폴리오 등록한 사이트 전체 가져와서 상세 내용 및 수정, 삭제 처리
 */
const getSiteListDetail = () => {
    getDocs(collection(dbStore, 'site')).then((result) => {
        result.forEach((docList) => {
            const docListData = docList.data()
            let isDescription

            if (isDescription === undefined) {
                isDescription = docListData.description
            }

            window.addEventListener('resize', () => {
                if (matchMedia('screen and (min-width: 940px) and (max-width: 1120px)').matches) {
                    isDescription = '지원하지 않는 해상도이며 원문 설명글을 보실 수 없습니다.'
                } else {
                    isDescription = docListData.description
                }
            })

            setTimeout(() => {
                const siteDetailViewTemplate = `
                    <div class="site-detail-view site-detail-view-${docList.id}">
                        <div class="btn-wrap">
                            <button id="modifyBtn" class="icon-btn" data-id="${docList.id}" type="button">
                                <img src="./images/edit.png" title="수정하기" />
                            </button>
                            <button id="deleteBtn" class="icon-btn" data-id="${docList.id}" type="button">
                                <img src="./images/trash.png" title="삭제하기" />
                            </button>
                        </div>
                        <span class="site-detail-view-type">${docListData.typeInfo['type']}</span>
                        <h3 class="site-detail-view-title">${docListData.title}</h3>
                        <span class="site-detail-view-period">프로젝트 기간 (${docListData.projectPeriod['startPeriod']} ~ ${docListData.projectPeriod['endPeriod']})</span>
                        <p class="site-detail-view-description"></p>
                        <a class="site-detail-view-link" href="${docListData.link}" target="_blank">
                            site link
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"/>
                                <path class="fill" d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" fill="#ffffff"/>
                            </svg>
                        </a>
                    </div>
                `

                // siteListTemplate 변수에 정의한 html의 doc.id(문서의 고유id)값을 가져와서 매치하여 실행
                const docListID = document.getElementById(docList.id)

                docListID?.addEventListener('mouseenter', () => {
                    document.getElementById(docList.id).insertAdjacentHTML('afterbegin', siteDetailViewTemplate)
                    document.querySelector('.site-detail-view-description').innerHTML += isDescription
                    document.querySelector('.site-detail-view').animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], 130)

                    const siteDetailViewLink = document.querySelector('.site-detail-view .site-detail-view-link')

                    siteDetailViewLink.addEventListener('mouseenter', (event) => {
                        const targetViewLink = event.target

                        targetViewLink.classList.add('active')
                        targetViewLink.children[0].innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"/>
                                <path class="fill" d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" fill="#000000"/>
                            </svg>
                        `
                    })

                    siteDetailViewLink.addEventListener('mouseleave', (event) => {
                        const targetViewLink = event.target

                        targetViewLink.classList.remove('active')
                        targetViewLink.children[0].innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"/>
                                <path class="fill" d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" fill="#ffffff"/>
                            </svg>
                        `
                    })

                    /**
                     * 포트폴리오 사이트 수정
                     */
                    document.querySelectorAll('#modifyBtn').forEach((el) => {
                        el.addEventListener('click', async () => {
                            portfolioSite()
                            calendarChange('start', 'end')
                            siteCategoriesChange()
                            siteTypeChange()
                            fileChange()

                            document.querySelector('#writeBtn').id = 'writeModifyBtn'
                            document.querySelector('.modal-title h2').textContent = '등록한 프로젝트를 수정 해보세요 :)'
                            document.querySelector('#writeModifyBtn').textContent = '수정하기'
                            document.querySelector('#writeModifyBtn').dataset.id = el.getAttribute('data-id')

                            document.querySelector('#startPeriod').value = docListData.projectPeriod['startPeriod']
                            document.querySelector('#endPeriod').value = docListData.projectPeriod['endPeriod']
                            document.querySelector('#siteName').value = docListData.title
                            document.querySelector('#siteDescription').value = docListData.description
                            document.querySelector('#siteLink').value = docListData.link
                            document.querySelector('.file-name').value = docListData.thumbnailUrl

                            // 수정을 안했을때 undefined 이므로 이전의 기존 데이터를 저장
                            if (docListData.projectPeriod['startPeriod'] !== undefined && docListData.projectPeriod['endPeriod'] !== undefined) {
                                startPeriodData = docListData.projectPeriod['startPeriod']
                                endPeriodData = docListData.projectPeriod['endPeriod']
                            }

                            // 분류 선택 후 등록 시 selected 가 true일때 다시 불러오기 위함
                            if (docListData.categoriesInfo['selected'] === true) {
                                let siteCategoriesDefalut = document.querySelector('#siteCategories')

                                for (let i = 0; i < siteCategoriesDefalut.length; i += 1) {
                                    siteCategoriesDefalut[i].removeAttribute('selected')

                                    for (let j = 0; j < siteCategoriesDefalut.length; j += 1) {
                                        if (siteCategoriesDefalut.options[j].value === docListData.categoriesInfo['categories']) {
                                            siteCategoriesDefalut.options[j].setAttribute('selected', 'selected')
                                            siteCategoriesData = siteCategoriesDefalut.options[j].value // 수정을 안했을때 undefined 이므로 이전의 기존 데이터를 저장
                                            isCategories = docListData.categoriesInfo['selected'] // 수정을 안했을때 undefined 이므로 이전의 기존 데이터를 저장
                                        }
                                    }
                                }
                            }

                            // 유형 선택 후 등록 시 selected 가 true일때 다시 불러오기 위함
                            if (docListData.typeInfo['selected'] === true) {
                                let siteTypeDefalut = document.querySelector('#siteType')

                                for (let i = 0; i < siteTypeDefalut.length; i += 1) {
                                    siteTypeDefalut[i].removeAttribute('selected')

                                    for (let j = 0; j < siteTypeDefalut.length; j += 1) {
                                        if (siteTypeDefalut.options[j].value === docListData.typeInfo['type']) {
                                            siteTypeDefalut.options[j].setAttribute('selected', 'selected')
                                            siteTypeData = siteTypeDefalut.options[j].value // 수정을 안했을때 undefined 이므로 이전의 기존 데이터를 저장
                                            isType = docListData.typeInfo['selected'] // 수정을 안했을때 undefined 이므로 이전의 기존 데이터를 저장
                                        }
                                    }
                                }
                            }

                            document.querySelectorAll('#writeModifyBtn').forEach((el) => {
                                el.addEventListener('click', async (event) => {
                                    if (isSuperAdmin) {
                                        const docRef = doc(dbStore, 'site', event.target.dataset.id)
                                        const dataUpdateSave = {
                                            projectPeriod: {
                                                startPeriod: startPeriodData, // 시작 기간
                                                endPeriod: endPeriodData, // 종료 기간
                                            },
                                            categoriesInfo: {
                                                categories: siteCategoriesData, // 분류 여부
                                                selected: isCategories, // 선택 여부
                                            },
                                            typeInfo: {
                                                type: siteTypeData, // 유형 여부
                                                selected: isType, // 선택 여부
                                            },
                                            title: siteName.value, // 사이트명
                                            description: siteDescription.value.replace(/(?:\r\n|\r|\n)/g, '<br />'), // 설명
                                            link: siteLink.value, // 사이트 주소
                                            thumbnailUrl: siteThumbnailUrl !== '' ? siteThumbnailUrl : document.querySelector('.file-name').value, // 썸네일 이미지 경로
                                        }

                                        try {
                                            await updateDoc(docRef, dataUpdateSave)
                                            windowPopup('게시물이 수정되었습니다.')
                                            document.querySelector('#windowPopupOk').addEventListener('click', () => {
                                                reload()
                                            })
                                        } catch (error) {
                                            windowPopup('게시물 수정 중 오류가 발생했습니다.<br>' + error.message)
                                        }
                                    } else {
                                        windowPopup('권한이 없습니다.<br>시스템 관리자에게 문의바랍니다.')
                                    }
                                })
                            })
                        })
                    })

                    /**
                     * 포트폴리오 사이트 삭제
                     */
                    document.querySelectorAll('#deleteBtn').forEach((el) => {
                        el.addEventListener('click', async () => {
                            windowPopup(
                                `"${docListData.title}" 게시물을 삭제하시겠습니까?<br>한번 삭제하면 복구할 수 없습니다.`,
                                `<button id="windowPopupCancel" class="bg-danger" type="button">취소</button>`
                            )
                            document.querySelector('#windowPopupOk').id = 'writeDeleteBtn'
                            document.querySelector('#writeDeleteBtn').dataset.id = el.getAttribute('data-id')

                            document.querySelectorAll('#writeDeleteBtn').forEach((delBtn) => {
                                delBtn.addEventListener('click', async (event) => {
                                    delBtn.closest('#popupBg').remove()

                                    if (isSuperAdmin) {
                                        const docRef = doc(dbStore, 'site', event.target.dataset.id)

                                        try {
                                            await deleteDoc(docRef)
                                            windowPopup('게시물이 삭제되었습니다.')
                                            document.querySelector('#windowPopupOk').addEventListener('click', () => {
                                                reload()
                                            })
                                        } catch (error) {
                                            windowPopup('게시물 삭제 중 오류가 발생했습니다.<br>' + error.message)
                                        }
                                    } else {
                                        windowPopup('권한이 없습니다.<br>시스템 관리자에게 문의바랍니다.')
                                    }
                                })
                            })
                        })
                    })
                })

                // siteDetailViewTemplate 변수에 정의한 html의 site-detail-view-'+doc.id' 매치하여 이벤트 실행
                docListID?.addEventListener('mouseleave', () => {
                    const detailView = document.querySelector('.site-detail-view-' + docList.id)

                    if (detailView) {
                        detailView.remove()
                    }
                })
            }, 500)
        })
    })
}
getSiteListDetail()

function signUp(self) {
    self.closest('.sign-auth-wrap').classList.toggle('switch-mode')
    document.querySelectorAll('input').forEach((el, i) => {
        el.value = ''
    })

    if (self.closest('.sign-auth-wrap').classList.contains('switch-mode')) { // 로그인 하기
        self.closest('.sign-auth-wrap .sign-info button').textContent = '일반 회원가입'
        document.querySelector('.modal-title h2').textContent = '로그인을 해주세요 :)'
        document.querySelector('.qa-member p').textContent = '아직 회원이 아니신가요?'
        document.querySelector('.sign-up-box').className = 'sign-in-box'
        document.querySelector('.sign-in-box .sign-btn').textContent = '로그인하기'
        document.querySelector('input[name=name]').remove()
        document.querySelector('.input-wrap').remove()
        document.querySelector('.eyes').remove()
        document.querySelector('.sns-sign-in-box').style.display = 'block'
        document.querySelector('.qa-password-find').style.display = 'flex'
    } else if (!self.closest('.sign-auth-wrap').classList.contains('switch-mode')) { // 회원 가입 하기
        self.closest('.sign-auth-wrap button').textContent = '로그인'
        document.querySelector('.modal-title h2').textContent = '회원가입을 해주세요 :)'
        document.querySelector('.qa-member p').textContent = '계정이 이미 있으신가요?'
        document.querySelector('.sign-in-box').className = 'sign-up-box'
        document.querySelector('.sign-up-box .sign-btn').textContent = '가입하기'
        document.querySelector('.sns-sign-in-box').style.display = 'none'
        document.querySelector('.qa-password-find').style.display = 'none'

        let inputNameHtml = '<input type="text" name="name" value="" autocomplete="off" placeholder="반드시 실명을(를) 입력해주세요." />'
        let inputPasswordHtml = '' +
            '<div class="input-wrap">' +
                '<input type="password" name="re_password" value="" autocomplete="off" placeholder="비밀번호을(를) 한번 더 입력해주세요." />' +
                '<img class="eyes" src="./images/eyes_on.png" alt="" />' +
            '</div>'

        document.querySelector('.sign-up-box .email-auth-box').insertAdjacentHTML('beforebegin', inputNameHtml)
        document.querySelector('.sign-up-box input[name=password]').insertAdjacentHTML('afterend', inputPasswordHtml)
        document.querySelector('.sign-up-box input[name=password]').insertAdjacentHTML('afterend', '<img class="eyes" src="./images/eyes_on.png" alt="" />')

        document.querySelectorAll('.eyes').forEach((el, i) => {
            el.addEventListener('click', () =>  {
                let togglePassword = document.querySelectorAll('input[name=password], input[name=re_password]')

                togglePassword.forEach((item) => {
                    item.classList.toggle('active')

                    document.querySelectorAll('.eyes').forEach((el) => {
                        if (item.classList.contains('active') === true) {
                            item.setAttribute('type', 'text')
                            el.src = './images/eyes_off.png'
                        } else {
                            item.setAttribute('type', 'password')
                            el.src = './images/eyes_on.png'
                        }
                    })
                })
            })
        })
    }
}

function signInUp(self) {
    let userEmail = document.querySelector('input[name=email]').value;
    let userPassword = (!!document.querySelector('input[name=password]') !== false) ? document.querySelector('input[name=password]').value : ''
    let user_rePassword = (!!document.querySelector('input[name=re_password]') !== false) ? document.querySelector('input[name=re_password]').value : ''

    if (self.textContent === '로그인하기') {
        if (!userEmail) {
            windowPopup('이메일을(를) 입력해주세요.')
            return
        } else if (!emailCheck(userEmail)) {
            windowPopup('이메일 형식이 올바르지 않습니다.')
            return
        } else if (!userPassword) {
            windowPopup('비밀번호을(를) 입력해주세요.')
            return
        }

        // 로그인 상태일때 브라우저 창을 닫고 다시 새창을 열었을때 자동 로그아웃
        setPersistence(dbAuth, browserSessionPersistence).then(() => {
            signInWithEmailAndPassword(dbAuth, userEmail, userPassword).then((result) => {
                if (result.user.emailVerified) { // 이메일 인증한 유저만 로그인 가능 (boolean 타입)
                    reload()
                } else {
                    windowPopup('이메일 인증이 확인되지 않았습니다.<br>인증 메일의 링크를 다시 보내드리겠습니다.')

                    document.querySelector('#windowPopupOk').addEventListener('click', () => {
                        sendEmailVerification(result.user).then(() => {
                            windowPopup(`${result.user.email} 이메일로 전송된 인증 메일의 링크를 클릭하여 인증을 완료해주세요.<br>인증 후 로그인이 가능합니다.`)

                            signOut(dbAuth)

                            document.querySelector('#windowPopupOk').id = 'emailCertificationReSend'
                            document.querySelectorAll('#emailCertificationReSend').forEach((el) => {
                                el.addEventListener('click', () => {
                                    el.closest('#popupBg').remove()
                                    reload()
                                })
                            })
                        })
                    })
                }
            }).catch((error) => {
                windowPopup('아이디 또는 비밀번호가 일치하지 않습니다.<br>회원이 아니시라면 회원 가입 후 이용해주세요.')
            })
        })
    } else if (self.textContent === 'google') {
        signInWithRedirect(dbAuth, googleProvider)
    } else if (self.textContent === 'facebook') {
        signInWithRedirect(dbAuth, facebookProvider)
    } else if (self.textContent === 'kakao') {
        window.Kakao.Auth.authorize()

        /*
        const kakaoHeader = {
            'Authorization': '130ea37cbaa01dd162b7a2eb96b96e44',
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        };
        const getKakaoToken = async (code) => {
            console.log('loginWithKakao')
            try {
                const data = {
                    grant_type: 'authorization_code',
                    client_id: '34d1864b0ed999a00aff11abe41e89b5',
                    redirect_uri: 'http://localhost:5000/auth',
                    code: code,
                }
                const queryString = Object.keys(data)
                    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
                    .join('&')
                const result = await axios.post('https://kauth.kakao.com/oauth/token', queryString, { headers: kakaoHeader })
                console.log('카카오 토큰', result)
                return result
            } catch (error) {
                return error
            }
        }
        getKakaoToken()
        */
    } else if (self.textContent === '수정하기') {
        updatePassword(dbAuth.currentUser, userPassword).then(() => {
            windowPopup('정상적으로 회원 정보가 수정되었습니다.')
            document.querySelector('#windowPopupOk').addEventListener('click', () => {
                reload()
            })
        }).catch((error) => {
            if (error.code === 'auth/weak-password') {
                windowPopup('비밀번호는 6자 이상이어야 합니다.')
                return
            }

            if (!userPassword || !user_rePassword) {
                windowPopup('비밀번호를 입력해주세요.')
                return
            } else if (userPassword !== user_rePassword) {
                windowPopup('비밀번호가 일치하지 않습니다.')
                return
            }

            windowPopup('회원 정보 수정에 실패하였습니다, 잠시 후 다시 시도해주세요.')
        })
    } else if (self.textContent === '가입하기') {
        let userName = document.querySelector('input[name=name]').value

        if (!userName) {
            windowPopup('이름을(를) 입력해주세요.')
            return
        } else if (!userEmail) {
            windowPopup('이메일을(를) 입력해주세요.')
            return
        } else if (!emailCheck(userEmail)) {
            windowPopup('이메일 형식이 올바르지 않습니다.')
            return
        } else if (!userPassword || !user_rePassword) {
            windowPopup('비밀번호을(를) 입력해주세요.')
            return
        } else if (userPassword !== user_rePassword) {
            windowPopup('비밀번호가 일치하지 않습니다.')
            return
        }

        createUserWithEmailAndPassword(dbAuth, userEmail, userPassword).then((result) => {
            updateProfile(result.user, {
                displayName: userName
            }).then(() => {
                sendEmailVerification(result.user)
                signOut(dbAuth) // createUserWithEmailAndPassword는 자동 로그인되기 때문에 메일 인증을 위해 로그아웃

                windowPopup('본인확인을 위해서 가입하신 이메일로 전송된 인증 메일의 링크를 클릭하여 인증을 완료해주세요.<br>인증 후 로그인이 가능합니다.')

                document.querySelector('#windowPopupOk').addEventListener('click', () => {
                    reload()
                })
            })
        }).catch(error => {
            if (error.code === 'auth/weak-password') {
                windowPopup('비밀번호는 6자 이상이어야 합니다.')
                return
            }

            if (error.code === 'auth/email-already-in-use') {
                windowPopup('이미 사용 중인 이메일 주소입니다.')
                return
            }

            windowPopup('회원가입에 실패하였습니다, 잠시 후 다시 시도해주세요.')
        })
    } else if (self.textContent === '보내기') {
        if (!emailCheck(userEmail)) {
            windowPopup('이메일 형식이 올바르지 않습니다.')
            return
        } else {
            sendPasswordResetEmail(dbAuth, userEmail).then(() => {

            }).catch(error => {
                windowPopup('잠시 후 다시 시도해주세요<br>' + error.message)
            })
        }
    }
}

/**
 * 비밀번호 찾기 초기화
 */
function passwordReset() {
    document.querySelector('.sign-in-box').className = 'password-reset-box'
    document.querySelector('.modal-title h2').textContent = '이메일로 비밀번호 재설정 링크를 보내드려요 :)'
    document.querySelector('.sign-btn').textContent = '보내기'
    document.querySelector('.sns-sign-in-box').remove()
    document.querySelector('.sign-info-box').remove()
    document.querySelector('input[name=password]').remove()
    document.querySelector('input[name=email]').placeholder = '가입시 등록한 이메일을 입력해 주세요.'
    document.querySelector('input[name=email]').value = ''
}

/**
 * 포트폴리오 사이트 탭 메뉴
 */
tabMenuCategories.forEach((el, index) => {
    el.addEventListener('click', (event) =>  {
        tabMenuCategories.forEach((el) => {
           el.classList.remove('active')
        })

        tabMenuContent.forEach((el) => {
            el.classList.remove('active')
        })

        tabMenuCategories[index].classList.add('active')
        tabMenuContent[index].classList.add('active')
   })
})

/**
 * 사용 경력 기술 소개
 */
skillBox.forEach((el, index) => {
    let dataSkill = el.getAttribute('data-skill')
    let skillTemplate = '' +
        '<div class="skill-view skill-view-'+ index +'">' +
            '<span>' + (dataSkill !== null ? dataSkill : "no skill") + '</span>' +
        '</div>'

    el.addEventListener('mouseenter', () => {
        el.insertAdjacentHTML('afterbegin', skillTemplate)

        el.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], 140)
    })

    el.addEventListener('mouseleave', () => {
        document.querySelector('.skill-view-'+index).remove()
    })
})

new Swiper('.swiper-tool-container.swiper-container', {
    slidesPerView: 5,
    spaceBetween: 10,

    scrollbar: {
        el: '.swiper-tool-container .swiper-scrollbar',
        draggable: true,
    },

    navigation: {
        nextEl: '.swiper-tool-container .swiper-button-next',
        prevEl: '.swiper-tool-container .swiper-button-prev',
    },

    breakpoints: {
        991: {
            slidesPerView: 3,
        },
        767: {
            slidesPerView: 2,
        },
        500: {
            slidesPerView: 1.1,
        },
    },
})

/**
 * 위/아래 스크롤 이동 버튼
 */
document.addEventListener('scroll', () => {
    if (document.documentElement.scrollTop > 0 || document.body.scrollTop > 0) {
        topBtn.classList.remove('opacity0')
    } else {
        topBtn.classList.add('opacity0')
    }

    // pageYOffset는 IE 및 모든 브라우저에서 지원하지만 scrollY는 IE에서는 지원을 안함
    if ((window.innerHeight + Math.ceil(window.pageYOffset)) >= document.body.offsetHeight) {
        topBtn.classList.add('opacity0')
    }
})
topBtn.addEventListener('click', () => {
    document.body.scrollIntoView({
        behavior: 'smooth'
    })
})

/**
 * 스크롤 시 화면 옵저버 이벤트
 */
let isScrollClick = false // isScrollClick 스크롤 후 메뉴 클릭 시 옵저버 실행 여부
let interfaceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && !isScrollClick) { // 화면에 요소가 보일때만
            menuList.forEach((menuEl) => {
                if (entry.target.dataset.offset === menuEl.dataset.offset) {
                    menuEl.classList.add('active')
                } else {
                    menuEl.classList.remove('active')
                }
            })
        }
    })
}, {
    // rootMargin: '0px 0px 0px 0px',
    threshold: 0.3 // 보이는 비율
})
for (let v of observerSelector) {
    interfaceObserver.observe(v)
}
